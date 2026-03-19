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

const ROLES = ['general', 'flight_deck', 'cabin_crew', 'atc', 'maintenance', 'ground_staff'];
const TARGET_PER_ROLE = 500;

// expanded Dictionaries
const TERMS = {
  flight_deck: ['engine oil pressure', 'fuel crossfeed', 'altitude', 'airspeed', 'landing gear', 'flap setting', 'autopilot', 'fms', 'transponder', 'weather radar', 'icing', 'turbulence', 'runway condition', 'stabilized approach', 'go-around', 'fuel reserves', 'thrust lever', 'yaw damper', 'nav frequency', 'gpws alert', 'master caution', 'efis display', 'cabin altitude', 'anti-ice system', 'hydraulic pump', 'ram air turbine', 'static port'],
  cabin_crew: ['passenger', 'boarding pass', 'seatbelt', 'emergency exit', 'galley', 'trolley', 'cabin pressure', 'medical kit', 'fire extinguisher', 'evacuation', 'first aid', 'special meal', 'unruly passenger', 'safety briefing', 'oxygen mask', 'lifevest', 'intercom', 'overhead bin', 'jumpseat', 'aisle chair', 'lavatory smoke detector', 'demo kit', 'passenger manifest', 'turbulence alert'],
  atc: ['clearance', 'vector', 'altitude', 'heading', 'squawk', 'runway', 'taxiway', 'traffic', 'separation', 'approach', 'tower', 'ground', 'departure', 'standard instrument departure', 'star', 'holding pattern', 'direct to', 'line up and wait', 'cleared for takeoff', 'contact departure', 'frequency change', 'report position', 'maintain visual', 'base leg', 'final approach'],
  maintenance: ['hydraulics', 'fuselage', 'aileron', 'rudder', 'elevator', 'turbine', 'wiring', 'avionics', 'inspection', 'maintenance manual', 'rivet', 'sealant', 'corrosion', 'landing gear', 'pnuematics', 'torque', 'fastener', 'logbook entry', 'deferred item', 'mel category', 'apu exhaust', 'tire pressure', 'brake wear', 'sensor calibration', 'structural repair'],
  ground_staff: ['baggage', 'check-in', 'gate', 'ramp', 'pushback', 'marshaller', 'tug', 'deboarding', 'security', 'customs', 'manifest', 'load sheet', 'fueling', 'gpu', 'cleaning crew', 'passenger bus', 'conveyor belt', 'cargo hold', 'unit load device', 'dangerous goods', 'oversized luggage', 'stand allocation', 'apron safety', 'tow bar'],
  general: ['schedule', 'training', 'safety', 'weather', 'delay', 'communication', 'teamwork', 'standard procedure', 'report', 'briefing', 'update', 'meeting', 'management', 'airline', 'airport', 'regulation', 'security protocol', 'fatigue management', 'resource management', 'shift change', 'briefing room', 'logistics', 'quality control']
};

const VERBS = ['check', 'monitor', 'inspect', 'verify', 'confirm', 'adjust', 'report', 'document', 'test', 'ensure', 'maintain', 'update', 'reset', 'secure'];
const CEFR = ['A2', 'B1', 'B2', 'C1'];

async function getCurrentCounts() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/questions?select=role_tag&is_latest=eq.true`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
  });
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  const data = await response.json();
  const counts = {};
  data.forEach(q => {
    counts[q.role_tag] = (counts[q.role_tag] || 0) + 1;
  });
  return counts;
}

function generateMC(role) {
  const term = TERMS[role][Math.floor(Math.random() * TERMS[role].length)];
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
  const cefr = CEFR[Math.floor(Math.random() * CEFR.length)];
  
  const content = `The ${term} must be ${verb}ed according to the protocol.\nA) correctly  B) correct  C) correctness  D) correcting`;
  return {
    section: 'grammar',
    type: 'multiple_choice',
    content: content,
    correct_answer: 'A',
    cefr_level: cefr,
    difficulty: cefr === 'A2' ? 'easy' : cefr === 'C1' ? 'hard' : 'medium',
    competency_tag: 'grammar_adverb',
    role_tag: role,
    is_latest: true,
    version_number: 1
  };
}

function generateFill(role) {
  const term = TERMS[role][Math.floor(Math.random() * TERMS[role].length)];
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
  const cefr = CEFR[Math.floor(Math.random() * CEFR.length)];

  const content = `The crew is required to _____ the ${term} in this situation.`;
  return {
    section: 'grammar',
    type: 'fill_blank',
    content: content,
    correct_answer: verb,
    cefr_level: cefr,
    difficulty: 'medium',
    competency_tag: 'vocabulary_action',
    role_tag: role,
    is_latest: true,
    version_number: 1
  };
}

function generateReading(role) {
  const term = TERMS[role][Math.floor(Math.random() * TERMS[role].length)];
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
  const cefr = CEFR[Math.floor(Math.random() * CEFR.length)];

  const content = `TEXT: The technical evaluation of the ${term} indicates that constant ${verb}ing is necessary for safety compliance. Regular inspections have shown that neglecting this procedure leads to premature wear.\n\nQUESTION: What is required for safety compliance according to the text?\nA) Constant ${verb}ing  B) Neglecting the procedure  C) Premature wear  D) Removing the ${term}`;
  return {
    section: 'reading',
    type: 'multiple_choice',
    content: content,
    correct_answer: 'A',
    cefr_level: cefr,
    difficulty: 'medium',
    competency_tag: 'reading_comprehension',
    role_tag: role,
    is_latest: true,
    version_number: 1
  };
}

function generateListening(role) {
  const term = TERMS[role][Math.floor(Math.random() * TERMS[role].length)];
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
  const cefr = CEFR[Math.floor(Math.random() * CEFR.length)];

  const content = `TRANSCRIPTION: Attention all crew. Please ${verb} the ${term} immediately to ensure a safe transition. Report any issues to the supervisor.\n\nQUESTION: What should the crew do immediately?\nA) ${verb} the ${term}  B) Ignore the situation  C) Wait for the supervisor  D) Change the transition`;
  return {
    section: 'listening',
    type: 'multiple_choice',
    content: content,
    correct_answer: 'A',
    cefr_level: cefr,
    difficulty: 'medium',
    competency_tag: 'listening_comprehension',
    role_tag: role,
    is_latest: true,
    version_number: 1
  };
}

const PATTERNS = [
  (r) => generateMC(r),
  (r) => generateFill(r),
  (r) => generateReading(r),
  (r) => generateListening(r),
  // ( ... previously existing ones ... )
];

async function main() {
  console.log('🚀 Starting Balanced Generation (Reading & Listening)...');
  
  let totalGenerated = 0;
  for (const role of ROLES) {
    console.log(`📝 Role ${role}: generating 50 Reading and 50 Listening questions...`);
    let batch = [];
    
    // 50 Reading
    for (let i = 0; i < 50; i++) {
        batch.push(generateReading(role));
    }
    // 50 Listening
    for (let i = 0; i < 50; i++) {
        batch.push(generateListening(role));
    }

    await insertBatch(batch);
    totalGenerated += batch.length;
    console.log(`✅ Role ${role} balanced.`);
  }

  console.log(`\n🎉 DONE! Generated ${totalGenerated} new balanced questions.`);
}

async function insertBatch(batch) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
      method: 'POST',
      headers: { 
        'apikey': SUPABASE_SERVICE_KEY, 
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify(batch)
    });
    if (!response.ok) {
        const body = await response.text();
        console.error('Batch failed:', body);
    }
  } catch (error) {
    console.error('Batch error:', error.message);
  }
}

main().catch(console.error);
