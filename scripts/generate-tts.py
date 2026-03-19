#!/usr/bin/env python3
"""
Avilingo TTS Audio Generator v2
- Reads listening questions from Supabase
- Generates audio with Edge TTS (free Microsoft voices)
- Compresses to opus with ffmpeg (32kbps mono — ~85% smaller than MP3)
- Uploads to Cloudflare R2 (zero egress cost)
- Updates question audio_url in Supabase
- NEW: Parallel batch processing (5x faster)
- NEW: Progress resume (skip already-processed questions)
- NEW: Automatic retry on failure
"""

import asyncio
import os
import re
import json
import subprocess
import tempfile
import time
import edge_tts
import boto3
from botocore.config import Config
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

# ─── CONFIGURATION ───
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://zpqnidyhfrejkxuxlbeg.supabase.co")
# Use service role key to bypass RLS when reading questions
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcW5pZHloZnJlamt4dXhsYmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU5MzUwNCwiZXhwIjoyMDg5MTY5NTA0fQ.GsD6G9B6JiXjFX1dRkrMYPbvRRzp90E5LgFiNgKWiww")

R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "601c9886f852efcc5b1492141a69fc77")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY", "3d91bc55fa0faf2a000a75da86c5947c")
R2_SECRET_KEY = os.environ.get("R2_SECRET_KEY", "e34bd5a9147167495047f3855908557b50ae2f09f41409f2efddc1e7d6df0d87")
R2_BUCKET     = "avilingo-audio"
R2_PUBLIC_URL = "https://pub-11093050d2324063bc76ef8b52b9e475.r2.dev"

BATCH_SIZE    = 5   # Process 5 questions in parallel
MAX_RETRIES   = 2   # Retry failed questions

# ─── VOICE MAPPING ───
VOICE_MAP = {
    "atc_phraseology":       "en-GB-RyanNeural",
    "atc_clearance_reading": "en-GB-RyanNeural",
    "cockpit_communication": "en-US-ChristopherNeural",
    "crew_coordination":     "en-US-ChristopherNeural",
    "cabin_announcement":    "en-GB-SoniaNeural",
    "passenger_instruction": "en-US-JennyNeural",
    "ground_ops_radio":      "en-AU-WilliamMultilingualNeural",
    "ground_communication":  "en-AU-WilliamMultilingualNeural",
    "emergency_broadcast":   "en-US-GuyNeural",
    "oral_briefing":         "en-GB-ThomasNeural",
    "default":               "en-US-AndrewNeural",
}

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
    match = re.search(r'\[AUDIO\]\s*"?(.+?)"?\s*\n', content, re.DOTALL)
    if match:
        text = match.group(1).strip().strip('"')
        text = re.sub(r'\[Audio transcript[^\]]*\]', '', text).strip()
        return text

    match = re.search(r'\[AUDIO\]\s*(.+?)(?:\n\n|\nWhat |\nWhen |\nWhere |\nWhy |\nHow |\nWhich |\nAt |\nBy |\nOrder)', content, re.DOTALL)
    if match:
        text = match.group(1).strip().strip('"')
        text = re.sub(r'\[Audio transcript[^\]]*\]', '', text).strip()
        return text

    match = re.search(r'"(.+?)"', content, re.DOTALL)
    if match:
        return match.group(1).strip()

    return None

def get_voice(competency_tag, role_tag):
    if competency_tag and competency_tag in VOICE_MAP:
        return VOICE_MAP[competency_tag]
    if role_tag and role_tag in ROLE_VOICE:
        return ROLE_VOICE[role_tag]
    return VOICE_MAP["default"]

# ─── TTS + COMPRESS ───
async def generate_audio(text, voice, output_path):
    tts = edge_tts.Communicate(text, voice, rate="-5%")
    await tts.save(output_path)

def compress_to_opus(input_path, output_path):
    """Compress audio to Opus/WebM: 32kbps, mono, 24kHz — optimal for speech."""
    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-c:a", "libopus",
        "-b:a", "32k",
        "-ar", "24000",
        "-ac", "1",
        "-application", "voip",
        output_path
    ]
    subprocess.run(cmd, capture_output=True, check=True)

def upload_to_r2(file_path, key):
    content_type = "audio/webm"
    s3.upload_file(
        file_path, R2_BUCKET, key,
        ExtraArgs={"ContentType": content_type}
    )
    return f"{R2_PUBLIC_URL}/{key}"

# ─── PROCESS ONE QUESTION ───
async def process_question(q, idx, total, stats):
    qid    = q["id"]
    role   = q.get("role_tag", "general")
    tag    = q.get("competency_tag", "")
    cefr   = q.get("cefr_level", "B1")
    qtype  = q.get("type", "multiple_choice")

    # For ordering type, we may have multiple audio fragments
    audio_text = extract_audio_text(q["content"])
    if not audio_text:
        print(f"  ⚠️  [{idx}/{total}] Cannot extract audio — skipping {qid[:8]}")
        stats["errors"] += 1
        return

    voice = get_voice(tag, role)
    print(f"  🔊 [{idx}/{total}] {role}/{tag or 'default'} ({cefr}) [{qtype}] → {voice}")

    for attempt in range(MAX_RETRIES + 1):
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                mp3_path  = os.path.join(tmpdir, "raw.mp3")
                opus_path = os.path.join(tmpdir, "compressed.webm")

                await generate_audio(audio_text, voice, mp3_path)
                mp3_size = os.path.getsize(mp3_path)

                compress_to_opus(mp3_path, opus_path)
                opus_size = os.path.getsize(opus_path)

                stats["size_before"] += mp3_size
                stats["size_after"]  += opus_size

                pct = (1 - opus_size / mp3_size) * 100 if mp3_size > 0 else 0
                print(f"     {mp3_size//1024}KB → {opus_size//1024}KB ({pct:.0f}% smaller)")

                r2_key     = f"listening/{role}/{qid}.webm"
                public_url = upload_to_r2(opus_path, r2_key)
                supabase_patch("questions", qid, {"audio_url": public_url})

                print(f"     ✅ {public_url}")
                stats["success"] += 1
                return

        except Exception as e:
            if attempt < MAX_RETRIES:
                print(f"     🔄 Retry {attempt+1}...")
                await asyncio.sleep(2)
            else:
                print(f"     ❌ Failed after {MAX_RETRIES+1} attempts: {e}")
                stats["errors"] += 1

# ─── BATCH PROCESSOR ───
async def process_batch(batch, base_idx, total, stats):
    tasks = [
        process_question(q, base_idx + i + 1, total, stats)
        for i, q in enumerate(batch)
    ]
    await asyncio.gather(*tasks)

# ─── MAIN ───
async def main():
    print("🎙  Avilingo TTS Audio Generator v2")
    print("=" * 55)

    questions = supabase_get(
        "questions",
        "section=eq.listening&active=eq.true&is_latest=eq.true"
        "&select=id,content,competency_tag,role_tag,cefr_level,audio_url,type"
        "&order=role_tag,created_at"
    )

    to_process = [q for q in questions if not q.get("audio_url")]

    print(f"📊 Total listening questions : {len(questions)}")
    print(f"🎯 Need audio generated      : {len(to_process)}")
    print(f"⚡ Batch size                : {BATCH_SIZE}")
    print(f"📦 Compression               : Opus 32kbps mono (WebM)")
    print()

    if not to_process:
        print("✅ All listening questions already have audio!")
        return

    stats = {"success": 0, "errors": 0, "size_before": 0, "size_after": 0}
    start_time = time.time()

    # Process in batches
    for i in range(0, len(to_process), BATCH_SIZE):
        batch = to_process[i:i + BATCH_SIZE]
        await process_batch(batch, i, len(to_process), stats)
        await asyncio.sleep(0.5)  # small pause between batches

    elapsed = time.time() - start_time
    print()
    print("=" * 55)
    print(f"🏁 DONE in {elapsed:.0f} seconds")
    print(f"   ✅ Success : {stats['success']}")
    print(f"   ❌ Errors  : {stats['errors']}")
    if stats["size_before"] > 0:
        saved = (1 - stats["size_after"] / stats["size_before"]) * 100
        print(f"   📦 Storage : {stats['size_before']//1024}KB → {stats['size_after']//1024}KB ({saved:.0f}% saved)")
    print(f"   🌐 Audio base URL: {R2_PUBLIC_URL}/listening/")

if __name__ == "__main__":
    asyncio.run(main())
