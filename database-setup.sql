create extension if not exists "uuid-ossp";

create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subscription_type text default 'pay-as-you-go',
  credit_balance int default 0,
  contact_email text,
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid references organizations(id),
  role text not null check (role in ('super_admin','hr_manager','instructor','student','candidate','evaluator')),
  full_name text,
  email text unique not null,
  created_at timestamptz default now()
);

create table exam_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  org_id uuid references organizations(id),
  role_profile text default 'general',
  grammar_count int default 19,
  reading_count int default 4,
  writing_count int default 3,
  speaking_count int default 4,
  listening_count int default 5,
  weight_grammar numeric default 10,
  weight_reading numeric default 20,
  weight_writing numeric default 20,
  weight_speaking numeric default 40,
  weight_listening numeric default 10,
  time_limit_mins int default 90,
  passing_cefr text default 'B2',
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default uuid_generate_v4(),
  section text not null check (section in ('grammar','reading','writing','speaking','listening')),
  type text not null,
  content text not null,
  audio_url text,
  correct_answer text,
  cefr_level text,
  competency_tag text,
  aircraft_context text,
  difficulty text default 'medium',
  usage_count int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table exams (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references users(id),
  org_id uuid references organizations(id),
  template_id uuid references exam_templates(id),
  status text default 'pending' check (status in ('pending','in_progress','completed','invalidated','grading','certified')),
  started_at timestamptz,
  completed_at timestamptz,
  final_cefr_score text,
  final_numeric_score numeric,
  created_at timestamptz default now()
);

create table exam_answers (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid references exams(id) on delete cascade,
  question_id uuid references questions(id),
  section text not null,
  answer text,
  audio_url text,
  time_spent_ms int,
  auto_score numeric,
  created_at timestamptz default now()
);

create table grades (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid references exams(id) on delete cascade,
  evaluator_id uuid references users(id),
  section text not null,
  numeric_score numeric,
  cefr_level text,
  feedback text,
  graded_at timestamptz defa
cat > ~/Desktop/avilingo-app/database-setup.sql << 'EOF'
create extension if not exists "uuid-ossp";

create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subscription_type text default 'pay-as-you-go',
  credit_balance int default 0,
  contact_email text,
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid references organizations(id),
  role text not null check (role in ('super_admin','hr_manager','instructor','student','candidate','evaluator')),
  full_name text,
  email text unique not null,
  created_at timestamptz default now()
);

create table exam_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  org_id uuid references organizations(id),
  role_profile text default 'general',
  grammar_count int default 19,
  reading_count int default 4,
  writing_count int default 3,
  speaking_count int default 4,
  listening_count int default 5,
  weight_grammar numeric default 10,
  weight_reading numeric default 20,
  weight_writing numeric default 20,
  weight_speaking numeric default 40,
  weight_listening numeric default 10,
  time_limit_mins int default 90,
  passing_cefr text default 'B2',
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default uuid_generate_v4(),
  section text not null check (section in ('grammar','reading','writing','speaking','listening')),
  type text not null,
  content text not null,
  audio_url text,
  correct_answer text,
  cefr_level text,
  competency_tag text,
  aircraft_context text,
  difficulty text default 'medium',
  usage_count int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table exams (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references users(id),
  org_id uuid references organizations(id),
  template_id uuid references exam_templates(id),
  status text default 'pending' check (status in ('pending','in_progress','completed','invalidated','grading','certified')),
  started_at timestamptz,
  completed_at timestamptz,
  final_cefr_score text,
  final_numeric_score numeric,
  created_at timestamptz default now()
);

create table exam_answers (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid references exams(id) on delete cascade,
  question_id uuid references questions(id),
  section text not null,
  answer text,
  audio_url text,
  time_spent_ms int,
  auto_score numeric,
  created_at timestamptz default now()
);

create table grades (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid references exams(id) on delete cascade,
  evaluator_id uuid references users(id),
  section text not null,
  numeric_score numeric,
  cefr_level text,
  feedback text,
  graded_at timestamptz default now()
);

create table certificates (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid references exams(id) on delete cascade,
  cefr_overall text not null,
  pdf_url text,
  issued_at timestamptz default now()
);

create table proctoring_events (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid references exams(id) on delete cascade,
  event_type text not null,
  snapshot_url text,
  captured_at timestamptz default now()
);

create table violations (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid references exams(id) on delete cascade,
  type text not null,
  strike_number int,
  occurred_at timestamptz default now()
);

create table credits (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id),
  amount int not null,
  used int default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table invoices (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id),
  amount numeric not null,
  vat_amount numeric default 0,
  status text default 'draft' check (status in ('draft','partial','paid','overdue')),
  due_date timestamptz,
  created_at timestamptz default now()
);

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references users(id),
  ip_address text,
  action text not null,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

create table email_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject text not null,
  body text not null,
  variables jsonb,
  created_at timestamptz default now()
);

alter table organizations enable row level security;
alter table users enable row level security;
alter table exams enable row level security;
alter table exam_answers enable row level security;
alter table grades enable row level security;
alter table certificates enable row level security;
alter table proctoring_events enable row level security;
alter table violations enable row level security;
alter table credits enable row level security;
alter table invoices enable row level security;
alter table audit_logs enable row level security;
alter table questions enable row level security;
alter table exam_templates enable row level security;
alter table email_templates enable row level security;

create policy "Users can view own data" on users for select using (auth.uid() = id);
create policy "Candidates view own exams" on exams for select using (auth.uid() = candidate_id);
create policy "Public read questions" on questions for select using (active = true);
