const fs = require('fs');
const path = require('path');

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
  console.log('🔍 Checking RLS Policies...');
  
  // Querying pg_policies through the REST API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/pg_policies?select=tablename,policyname,cmd,qual&schemaname=eq.public`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
  });
  
  if (!response.ok) {
    console.error(`Error: ${response.status}`, await response.text());
    return;
  }

  const policies = await response.json();
  console.log('Current Policies:');
  policies.forEach(p => {
    console.log(`- [${p.tablename}] ${p.policyname} (${p.cmd}): ${p.qual}`);
  });

  const tables = ['questions', 'question_analytics', 'question_assignments', 'departments', 'sub_roles'];
  tables.forEach(t => {
     const hasRead = policies.some(p => p.tablename === t && (p.cmd === 'SELECT' || p.cmd === 'ALL'));
     if (!hasRead) console.warn(`⚠️  WARNING: Table [${t}] has NO read policy! Frontend calls will fail.`);
  });
}

main().catch(console.error);
