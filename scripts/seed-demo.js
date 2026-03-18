const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function safeDeleteAll() {
  console.log('--- Wiping Existing Demo Data ---');
  // Order matters for foreign keys: exam_answers -> exams -> users / templates -> organizations
  
  // 1. Exam Answers
  console.log('Deleting exam_answers...');
  const { error: eaErr } = await supabase.from('exam_answers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (eaErr) console.log('Warning:', eaErr.message);

  // 2. Exams
  console.log('Deleting exams...');
  const { error: eErr } = await supabase.from('exams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (eErr) console.log('Warning:', eErr.message);

  // 3. Exam Templates
  console.log('Deleting exam_templates...');
  const { error: etErr } = await supabase.from('exam_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (etErr) console.log('Warning:', etErr.message);

  // 4. Users (Only candidates & HRs, keep super_admins safely if possible, but let's wipe all non-super_admin)
  console.log('Deleting non-super_admin users...');
  const { error: uErr } = await supabase.from('users').delete().neq('role', 'super_admin');
  if (uErr) console.log('Warning:', uErr.message);

  // 5. Organizations (We will wipe all except the ones we are about to create, or just wipe all)
  console.log('Deleting organizations...');
  const { error: oErr } = await supabase.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (oErr) console.log('Warning:', oErr.message);
}

const AIRLINES = [
  { name: 'Avilingo Management', domain: 'avilingo.com', logo_url: 'https://avilingo.com/logo.png', contact_person: 'Sercan A.', contact_email: 'admin@avilingo.com' },
  { name: 'Turkish Airlines', domain: 'thy.com', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Turkish_Airlines_logo_2019_compact.svg/1200px-Turkish_Airlines_logo_2019_compact.svg.png', contact_person: 'Ahmet Y.', contact_email: 'hr@thy.com' },
  { name: 'Pegasus Airlines', domain: 'flypgs.com', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Pegasus_Airlines_logo.svg/2560px-Pegasus_Airlines_logo.svg.png', contact_person: 'Mehmet N.', contact_email: 'hr@flypgs.com' },
  { name: 'SunExpress', domain: 'sunexpress.com', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/SunExpress_Logo.svg/1024px-SunExpress_Logo.svg.png', contact_person: 'Ayse K.', contact_email: 'hr@sunexpress.com' },
  { name: 'Corendon Airlines', domain: 'corendonairlines.com', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Corendon_Airlines_logo.svg/1024px-Corendon_Airlines_logo.svg.png', contact_person: 'Ali C.', contact_email: 'hr@corendonairlines.com' },
  { name: 'Freebird Airlines', domain: 'freebirdairlines.com', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/Freebird_Airlines_logo.svg/1200px-Freebird_Airlines_logo.svg.png', contact_person: 'Burcu Y.', contact_email: 'hr@freebirdairlines.com' },
  { name: 'Tailwind Airlines', domain: 'tailwind.com.tr', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Tailwind_Airlines_Logo.svg/2560px-Tailwind_Airlines_Logo.svg.png', contact_person: 'Cem O.', contact_email: 'hr@tailwind.com.tr' }
];

const ROLES = ['flight_deck', 'cabin_crew', 'atc', 'maintenance', 'ground_staff', 'general'];
const CEFR_SCORES = ['A1', 'A2', 'B1', 'B2', 'C1'];

const FIRST_NAMES = ['Aylin', 'Batuhan', 'Cemre', 'Deniz', 'Efe', 'Furkan', 'Gizem', 'Hakan', 'Irem', 'Kaan', 'Leyla', 'Mert', 'Nil', 'Ozan', 'Pelin', 'Semih', 'Tugba', 'Umut', 'Volkan', 'Zeynep'];
const LAST_NAMES = ['Kaya', 'Yilmaz', 'Demir', 'Celik', 'Yildiz', 'Erdogan', 'Kose', 'Aydin', 'Ozturk', 'Sahin', 'Arslan', 'Dogan', 'Kilic', 'Cetin', 'Kara'];

async function seedData() {
  await safeDeleteAll();

  console.log('--- Seeding Organizations ---');
  const orgMap = {};
  for (let a of AIRLINES) {
    const { data: org, error } = await supabase.from('organizations').insert({
      name: a.name,
      domain: a.domain,
      logo_url: a.logo_url,
      contact_person: a.contact_person,
      contact_email: a.contact_email,
      contract_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(), // 1 year end
      created_at: new Date().toISOString()
    }).select('id').single();
    if (error) console.log('Err inserting Org:', error.message);
    else orgMap[a.name] = org.id;
  }

  console.log('--- Seeding Candidates & Users ---');
  const userMap = {}; // { orgName: [userIds] }
  for (let orgName of Object.keys(orgMap)) {
    userMap[orgName] = [];
    // Give each airline ~6-10 candidates
    const count = orgName === 'Avilingo Management' ? 3 : 8;
    for (let i=0; i<count; i++) {
      const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const role = ROLES[Math.floor(Math.random() * ROLES.length)];
      
      const { data: usr, error } = await supabase.from('users').insert({
        full_name: `${f} ${l}`,
        email: `${f.toLowerCase()}.${l.toLowerCase()}@${AIRLINES.find(a=>a.name===orgName)?.domain || 'example.com'}`,
        role: 'candidate',
        org_id: orgMap[orgName],
        created_at: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString() // Random time in last 30 days
      }).select('id').single();
      
      if (error) console.log('Err inserting User:', error.message);
      else userMap[orgName].push({ id: usr.id, role_profile: role });
    }
  }

  console.log('--- Seeding Exam Templates ---');
  let templates = [];
  for (let role of ROLES) {
    const { data: tpl, error } = await supabase.from('exam_templates').insert({
      name: `Standard ${role.replace('_',' ').toUpperCase()} ICAO Assessment`,
      role_profile: role,
      grammar_count: 15, reading_count: 5, writing_count: 2, speaking_count: 3, listening_count: 6,
      weight_grammar: 10, weight_reading: 20, weight_writing: 20, weight_speaking: 30, weight_listening: 20,
      time_limit_mins: 60,
      passing_cefr: 'B2',
      proctoring_enabled: true
    }).select('id, name').single();
    if (!error) templates.push({ id: tpl.id, role_profile: role });
  }

  // Get one real question ID to satisfy foreign keys
  const { data: randQ } = await supabase.from('questions').select('id').limit(1).single();
  const fallbackQid = randQ ? randQ.id : '00000000-0000-0000-0000-000000000000';

  console.log('--- Seeding Completed Exams API ---');
  for (let orgName of Object.keys(userMap)) {
    for (let candidate of userMap[orgName]) {
      // Create an exam assigned to this candidate
      const candRole = candidate.role_profile;
      const tpl = templates.find(t => t.role_profile === candRole) || templates[0];
      const finalCefr = CEFR_SCORES[Math.floor(Math.random() * CEFR_SCORES.length)];

      const { data: exam, error: exErr } = await supabase.from('exams').insert({
        template_id: tpl.id,
        candidate_id: candidate.id,
        org_id: orgMap[orgName],
        status: 'certified',
        scheduled_for: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        started_at: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
        completed_at: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
        final_numeric_score: Math.floor(Math.random() * 40 + 60), // 60-100 random numeric score
        final_cefr_score: finalCefr,
        created_at: new Date().toISOString()
      }).select('id').single();

      if (exErr) {
         console.log('Err inserting Exam:', exErr.message);
         continue;
      }

      // Add dummy exam answers for the review UI
      const sections = ['grammar', 'reading', 'listening', 'writing', 'speaking'];
      const dummyQuestions = [
        { section: 'grammar', content: 'The flight ____ delayed due to heavy snow.', answer: 'was' },
        { section: 'reading', content: 'METAR LTFM 251600Z... What is the visibility?', answer: '10km' },
        { section: 'listening', content: '[Audio: Tower, Requesting start up]', answer: 'startup_request' },
        { section: 'writing', content: 'Write a brief incident report about a bird strike on the windshield.', answer: 'bird_strike_report' },
        { section: 'speaking', content: 'Read the following clearance back to ATC: "Cleared to destination via routing, climb FL 360."', answer: 'audio_response' }
      ];

      for (let s of sections) {
        let q = dummyQuestions.find(dq => dq.section === s);
        await supabase.from('exam_answers').insert({
          exam_id: exam.id,
          question_id: fallbackQid, // Satisfy FK
          candidate_answer: s === 'speaking' ? 'https://example.com/audio.mp3' : (s === 'writing' ? 'At 1620Z during climbout passing 3000ft, a bird struck the left windshield. No structural damage detected but requested return to field as precaution.' : 'Candidate answered this correctly.'),
          is_correct: Math.random() > 0.2, // 80% correct
          score: Math.floor(Math.random() * 20),
          cefr_level: finalCefr,
          ai_feedback: s === 'speaking' || s === 'writing' ? 'Good use of aviation phraseology, clear flow of events.' : null,
          transcription: s === 'speaking' ? 'Tower, we are requesting a return to the field, we suspect a bird strike on the left side.' : null
        });
      }
    }
  }

  console.log('--- Full Database Seed Completed! ---');
}

seedData();
