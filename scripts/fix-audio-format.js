const fs = require('fs');
const path = require('path');

// Helper to load .env.local manually
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('🔧 Fixing Audio Format in Supabase (v2)...');
  
  const filter = encodeURIComponent('ilike.*TRANSCRIPTION:*');
  const url = `${SUPABASE_URL}/rest/v1/questions?select=id,content&content=${filter}`;
  
  const response = await fetch(url, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error(`Fetch failed with status ${response.status}:`, text.slice(0, 500));
    return;
  }

  const questions = await response.json();
  console.log(`Found ${questions.length} questions to fix.`);

  for (const q of questions) {
    const newContent = q.content.replace('TRANSCRIPTION:', '[AUDIO]');
    
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${q.id}`, {
      method: 'PATCH',
      headers: { 
        'apikey': SUPABASE_SERVICE_KEY, 
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: newContent })
    });
    
    if (!updateRes.ok) {
      console.error(`\nFailed to update ${q.id}:`, await updateRes.text());
    } else {
      process.stdout.write('.');
    }
  }

  console.log('\n✅ Done! Now rerunning TTS...');
}

main().catch(console.error);
