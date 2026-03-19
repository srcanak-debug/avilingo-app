const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function wipeAndMinimalSeed() {
  console.log('--- Wiping All Data ---');
  
  // 1. Exam Answers
  console.log('Deleting exam_answers...');
  await supabase.from('exam_answers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. Exams
  console.log('Deleting exams...');
  await supabase.from('exams').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 3. Exam Templates
  console.log('Deleting exam_templates...');
  await supabase.from('exam_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 4. Users (Keep super_admins)
  console.log('Deleting non-super_admin users...');
  await supabase.from('users').delete().neq('role', 'super_admin');

  // 5. Organizations
  console.log('Deleting organizations...');
  await supabase.from('organizations').delete().neq('name', 'Avilingo Management');

  console.log('--- Seeding Minimal Test Data ---');

  // 1. Create a Test Organization
  const { data: org, error: orgErr } = await supabase.from('organizations').insert({
    name: 'Test Airline Corp',
    domain: 'testairline.com',
    contact_person: 'Test Admin',
    contact_email: 'admin@testairline.com',
    created_at: new Date().toISOString()
  }).select('id').single();

  if (orgErr) {
    console.error('Error creating org:', orgErr.message);
    return;
  }
  console.log('Test Organization created:', org.id);

  // 2. Create a Test Candidate
  const { data: cand, error: candErr } = await supabase.from('users').insert({
    full_name: 'John Doe (Test)',
    email: 'john.doe@testairline.com',
    role: 'candidate',
    org_id: org.id,
    created_at: new Date().toISOString()
  }).select('id').single();

  if (candErr) {
    console.error('Error creating candidate:', candErr.message);
    return;
  }
  console.log('Test Candidate created:', cand.id);

  // 3. Create a Test Template
  const { data: tpl, error: tplErr } = await supabase.from('exam_templates').insert({
    name: 'Basic Cabin Crew Test',
    role_profile: 'cabin_crew',
    grammar_count: 10,
    reading_count: 5,
    listening_count: 5,
    writing_count: 1,
    speaking_count: 1,
    time_limit_mins: 45,
    passing_cefr: 'B1'
  }).select('id').single();

  if (tplErr) {
    console.error('Error creating template:', tplErr.message);
    return;
  }
  console.log('Test Template created:', tpl.id);

  console.log('--- System Ready for Single Test Case ---');
}

wipeAndMinimalSeed();
