-- ═══════════════════════════════════════════════════════════════
-- AVILINGO — ADMIN PANEL FIX (v3 - Nuclear Alignment)
-- Reconciles database schema with Admin UI requirements
-- ═══════════════════════════════════════════════════════════════

-- 1. Ensure columns exist in 'questions' table
ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS version_number INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS role_tag TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS parent_question_id UUID REFERENCES questions(id);

-- Sync is_latest for old rows
UPDATE questions SET is_latest = true WHERE is_latest IS NULL;

-- 2. Drop and Recreate auxiliary tables (Clean start for these empty tables)
-- This ensures the UNIQUE constraint is correctly applied.
DROP TABLE IF EXISTS question_assignments CASCADE;
DROP TABLE IF EXISTS question_analytics CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS sub_roles CASCADE;

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sub_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE question_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  difficulty_index NUMERIC DEFAULT 100,
  total_attempts INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT question_analytics_question_id_unique UNIQUE (question_id)
);

CREATE TABLE question_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  dept_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  sub_role_id UUID REFERENCES sub_roles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Populate default metadata
INSERT INTO departments (name) VALUES 
  ('Flight Operations'), ('Cabin Service'), ('Ground Ops'), ('Technic'), ('ATC')
ON CONFLICT (name) DO NOTHING;

INSERT INTO sub_roles (name) VALUES 
  ('Junior'), ('Senior'), ('Captain'), ('Lead Technician'), ('Chief')
ON CONFLICT (name) DO NOTHING;

-- 4. Initialize analytics for ALL questions
INSERT INTO question_analytics (question_id)
SELECT id FROM questions
ON CONFLICT (question_id) DO NOTHING;

-- 5. Security & RLS
ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_assignments ENABLE ROW LEVEL SECURITY;

-- Safety: Drop existing policies first to avoid "already exists" errors
DROP POLICY IF EXISTS "Allow public read on metadata" ON departments;
DROP POLICY IF EXISTS "Allow public read on sub_roles" ON sub_roles;
DROP POLICY IF EXISTS "Admins full access to analytics" ON question_analytics;

CREATE POLICY "Allow public read on metadata" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public read on sub_roles" ON sub_roles FOR SELECT USING (true);
CREATE POLICY "Admins full access to analytics" ON question_analytics FOR ALL USING (true);

-- Done!
SELECT count(*) as total_questions FROM questions WHERE is_latest = true;
