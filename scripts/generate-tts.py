#!/usr/bin/env python3
"""
Avilingo TTS Audio Generator
- Reads listening questions from Supabase
- Generates audio with Edge TTS (free Microsoft voices)
- Compresses to opus with ffmpeg
- Uploads to Cloudflare R2
- Updates question audio_url in Supabase
"""

import asyncio
import os
import re
import json
import subprocess
import tempfile
import edge_tts
import boto3
from botocore.config import Config
import urllib.request
import urllib.parse

# ─── CONFIGURATION ───
SUPABASE_URL = "https://zpqnidyhfrejkxuxlbeg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcW5pZHloZnJlamt4dXhsYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTM1MDQsImV4cCI6MjA4OTE2OTUwNH0.dVkG5o0bTqiHmXKT9UPt6vuOR25Yunn8uoytRC_EFb0"

R2_ACCOUNT_ID = "601c9886f852efcc5b1492141a69fc77"
R2_ACCESS_KEY = "3d91bc55fa0faf2a000a75da86c5947c"
R2_SECRET_KEY = "e34bd5a9147167495047f3855908557b50ae2f09f41409f2efddc1e7d6df0d87"
R2_BUCKET = "avilingo-audio"
R2_PUBLIC_URL = "https://pub-11093050d2324063bc76ef8b52b9e475.r2.dev"

# ─── VOICE MAPPING ───
# Context-aware voice selection for realistic audio
VOICE_MAP = {
    # ATC / Tower communications
    "atc_phraseology":       "en-GB-RyanNeural",
    "atc_clearance_reading": "en-GB-RyanNeural",
    
    # Cockpit / Pilot
    "cockpit_communication": "en-US-ChristopherNeural",
    "crew_coordination":     "en-US-ChristopherNeural",
    
    # Cabin announcements
    "cabin_announcement":    "en-GB-SoniaNeural",
    "passenger_instruction": "en-US-JennyNeural",
    
    # Ground operations
    "ground_ops_radio":      "en-AU-WilliamMultilingualNeural",
    "ground_communication":  "en-AU-WilliamMultilingualNeural",
    
    # Emergency
    "emergency_broadcast":   "en-US-GuyNeural",
    
    # Training / Briefing
    "oral_briefing":         "en-GB-ThomasNeural",
    
    # Default
    "default":               "en-US-AndrewNeural",
}

# Role-based default voice (fallback)
ROLE_VOICE = {
    "flight_deck":  "en-US-ChristopherNeural",
    "cabin_crew":   "en-GB-SoniaNeural",
    "atc":          "en-GB-RyanNeural",
    "maintenance":  "en-AU-WilliamMultilingualNeural",
    "ground_staff": "en-AU-WilliamMultilingualNeural",
    "general":      "en-US-AndrewNeural",
}

# ─── R2 CLIENT ───
s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)

# ─── SUPABASE HELPERS ───
def supabase_get(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def supabase_patch(table, id_val, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{id_val}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method="PATCH", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    })
    urllib.request.urlopen(req)

# ─── AUDIO EXTRACTION ───
def extract_audio_text(content):
    """Extract the spoken text from [AUDIO] tagged content."""
    # Remove the question part (after the last \n\n before answer choices)
    # Find [AUDIO] marker and extract quoted speech
    match = re.search(r'\[AUDIO\]\s*"?(.+?)"?\s*\n', content, re.DOTALL)
    if match:
        text = match.group(1).strip().strip('"')
        # Clean up for TTS
        text = re.sub(r'\[Audio transcript[^]]*\]', '', text).strip()
        return text
    
    # Try alternative: everything between [AUDIO] and the question
    match = re.search(r'\[AUDIO\]\s*(.+?)(?:\n\n|\nWhat |\nWhen |\nWhere |\nWhy |\nHow |\nWhich |\nAt |\nBy )', content, re.DOTALL)
    if match:
        text = match.group(1).strip().strip('"')
        text = re.sub(r'\[Audio transcript[^]]*\]', '', text).strip()
        return text
    
    # Fallback: try to get text between quotes
    match = re.search(r'"(.+?)"', content, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    return None

def get_voice(competency_tag, role_tag):
    """Select the best voice based on context."""
    if competency_tag and competency_tag in VOICE_MAP:
        return VOICE_MAP[competency_tag]
    if role_tag and role_tag in ROLE_VOICE:
        return ROLE_VOICE[role_tag]
    return VOICE_MAP["default"]

# ─── TTS + COMPRESS ───
async def generate_audio(text, voice, output_path):
    """Generate audio with Edge TTS."""
    tts = edge_tts.Communicate(text, voice, rate="-5%")  # Slightly slower for clarity
    await tts.save(output_path)

def compress_to_opus(input_path, output_path):
    """Compress MP3 to Opus/WebM for smaller file size."""
    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-c:a", "libopus",
        "-b:a", "32k",        # 32kbps — very small but clear for speech
        "-ar", "24000",        # 24kHz sample rate — enough for speech
        "-ac", "1",            # Mono — speech doesn't need stereo
        "-application", "voip", # Optimized for speech
        output_path
    ]
    subprocess.run(cmd, capture_output=True, check=True)

def upload_to_r2(file_path, key):
    """Upload file to Cloudflare R2."""
    content_type = "audio/webm" if key.endswith(".webm") else "audio/ogg"
    s3.upload_file(
        file_path, R2_BUCKET, key,
        ExtraArgs={"ContentType": content_type}
    )
    return f"{R2_PUBLIC_URL}/{key}"

# ─── MAIN ───
async def main():
    print("🎙  Avilingo TTS Audio Generator")
    print("=" * 50)
    
    # Fetch all listening questions without audio
    questions = supabase_get(
        "questions",
        "section=eq.listening&active=eq.true&is_latest=eq.true&select=id,content,competency_tag,role_tag,cefr_level,audio_url&order=role_tag,created_at"
    )
    
    # Filter to those without audio_url
    to_process = [q for q in questions if not q.get("audio_url")]
    
    print(f"📊 Found {len(questions)} listening questions, {len(to_process)} need audio")
    
    if not to_process:
        print("✅ All listening questions already have audio!")
        return
    
    success = 0
    errors = 0
    total_size_before = 0
    total_size_after = 0
    
    for i, q in enumerate(to_process):
        qid = q["id"]
        role = q.get("role_tag", "general")
        tag = q.get("competency_tag", "")
        cefr = q.get("cefr_level", "B1")
        
        # Extract speakable text
        audio_text = extract_audio_text(q["content"])
        if not audio_text:
            print(f"  ⚠️  [{i+1}/{len(to_process)}] Could not extract audio text — skipping {qid[:8]}")
            errors += 1
            continue
        
        # Select voice
        voice = get_voice(tag, role)
        
        print(f"  🔊 [{i+1}/{len(to_process)}] {role}/{tag or 'default'} ({cefr}) → {voice}")
        print(f"     Text: {audio_text[:80]}{'...' if len(audio_text) > 80 else ''}")
        
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                mp3_path = os.path.join(tmpdir, "raw.mp3")
                opus_path = os.path.join(tmpdir, "compressed.webm")
                
                # Generate TTS
                await generate_audio(audio_text, voice, mp3_path)
                mp3_size = os.path.getsize(mp3_path)
                
                # Compress
                compress_to_opus(mp3_path, opus_path)
                opus_size = os.path.getsize(opus_path)
                
                total_size_before += mp3_size
                total_size_after += opus_size
                
                compression = (1 - opus_size / mp3_size) * 100 if mp3_size > 0 else 0
                print(f"     Size: {mp3_size//1024}KB → {opus_size//1024}KB ({compression:.0f}% smaller)")
                
                # Upload to R2
                r2_key = f"listening/{role}/{qid}.webm"
                public_url = upload_to_r2(opus_path, r2_key)
                
                # Update Supabase
                supabase_patch("questions", qid, {"audio_url": public_url})
                
                print(f"     ✅ Uploaded → {public_url}")
                success += 1
                
        except Exception as e:
            print(f"     ❌ Error: {e}")
            errors += 1
    
    # Summary
    print("\n" + "=" * 50)
    print(f"🏁 DONE!")
    print(f"   ✅ Success: {success}")
    print(f"   ❌ Errors:  {errors}")
    if total_size_before > 0:
        print(f"   📦 Total size: {total_size_before//1024}KB → {total_size_after//1024}KB ({(1-total_size_after/total_size_before)*100:.0f}% saved)")
    print(f"   🌐 Audio URL base: {R2_PUBLIC_URL}/listening/")

if __name__ == "__main__":
    asyncio.run(main())
