-- ═══════════════════════════════════════════════════════════════
-- AVILINGO — ADMIN PANEL FIX (0 Question Bug)
-- Reconciles database schema with Admin UI requirements
-- ═══════════════════════════════════════════════════════════════

-- 1. Add missing columns to 'questions' table
ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS version_number INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS role_tag TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS parent_question_id UUID REFERENCES questions(id);

-- Ensure existing questions have is_latest = true
UPDATE questions SET is_latest = true WHERE is_latest IS NULL;

-- 2. Create missing auxiliary tables
CREATE TABLE IF NOT EXISTS question_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  difficulty_index NUMERIC DEFAULT 100, -- 0-100 Success Rate
  total_attempts INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure the UNIQUE constraint exists (for ON CONFLICT to work)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_analytics_question_id_key') THEN
    ALTER TABLE question_analytics ADD CONSTRAINT question_analytics_question_id_key UNIQUE (question_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sub_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS question_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  dept_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  sub_role_id UUID REFERENCES sub_roles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Populate default metadata (so filters work)
INSERT INTO departments (name) VALUES ('Flight Operations'), ('Cabin Service'), ('Ground Ops'), ('Technic') 
ON CONFLICT (name) DO NOTHING;

INSERT INTO sub_roles (name) VALUES ('Junior'), ('Senior'), ('Captain'), ('Lead Technician') 
ON CONFLICT (name) DO NOTHING;

-- 4. Initialize analytics for existing questions
INSERT INTO question_analytics (question_id)
SELECT id FROM questions
ON CONFLICT (question_id) DO NOTHING;

-- 5. Enable RLS for new tables
ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on metadata" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public read on sub_roles" ON sub_roles FOR SELECT USING (true);
CREATE POLICY "Admins full access to analytics" ON question_analytics FOR ALL USING (true);

-- Done!
SELECT count(*) as total_questions FROM questions WHERE is_latest = true;
