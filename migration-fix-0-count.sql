-- ═══════════════════════════════════════════════════════════════
-- AVILINGO — ADMIN PANEL FIX (FINAL SIMPLIFIED)
-- ADIM 1: YAPIYI DÜZELTME
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabloları temizleyelim (Yeni eklenen yardımcı tablolar)
DROP TABLE IF EXISTS question_assignments CASCADE;
DROP TABLE IF EXISTS question_analytics CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS sub_roles CASCADE;

-- 2. Sorular tablosuna eksik kolonları ekleyelim
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS version_number INT DEFAULT 1;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS role_tag TEXT DEFAULT 'general';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS parent_question_id UUID REFERENCES questions(id);

UPDATE questions SET is_latest = true WHERE is_latest IS NULL;

-- 3. Yardımcı tabloları en baştan düzgün kuralım
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
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  difficulty_index NUMERIC DEFAULT 100,
  total_attempts INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT q_analytics_q_id_unique UNIQUE (question_id)
);

CREATE TABLE question_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  dept_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  sub_role_id UUID REFERENCES sub_roles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Verileri ve Politikaları ekleyelim
INSERT INTO departments (name) VALUES ('Flight Ops'), ('Cabin'), ('Ground'), ('Technic'), ('ATC') ON CONFLICT DO NOTHING;
INSERT INTO sub_roles (name) VALUES ('Junior'), ('Senior'), ('Captain'), ('Lead'), ('Chief') ON CONFLICT DO NOTHING;

INSERT INTO question_analytics (question_id)
SELECT id FROM questions
ON CONFLICT (question_id) DO NOTHING;

-- 5. Güvenlik
ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_depts" ON departments;
CREATE POLICY "public_read_depts" ON departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_subs" ON sub_roles;
CREATE POLICY "public_read_subs" ON sub_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_all_analytics" ON question_analytics;
CREATE POLICY "admin_all_analytics" ON question_analytics FOR ALL USING (true);

SELECT count(*) as result FROM questions WHERE is_latest = true;
