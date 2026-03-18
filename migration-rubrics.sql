-- ═══════════════════════════════════════════════════════════════
-- RUBRIC-BASED GRADING MIGRATION
-- Run this after the initial database-setup.sql
-- ═══════════════════════════════════════════════════════════════

-- Question-level rubrics (set per question in admin, or use defaults)
CREATE TABLE IF NOT EXISTS question_rubrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  criterion text NOT NULL,
  description text DEFAULT '',
  max_score numeric DEFAULT 10,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Per-criterion grade details (stored alongside the main grade)
CREATE TABLE IF NOT EXISTS grade_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id uuid REFERENCES grades(id) ON DELETE CASCADE,
  criterion text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  max_score numeric NOT NULL DEFAULT 10,
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Add answer_id to grades for per-answer grading (not just per-section)
ALTER TABLE grades ADD COLUMN IF NOT EXISTS answer_id uuid REFERENCES exam_answers(id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_grade_details_grade_id ON grade_details(grade_id);
CREATE INDEX IF NOT EXISTS idx_question_rubrics_question_id ON question_rubrics(question_id);
CREATE INDEX IF NOT EXISTS idx_grades_answer_id ON grades(answer_id);

-- RLS
ALTER TABLE question_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rubrics readable by all" ON question_rubrics FOR SELECT USING (true);
CREATE POLICY "Grade details readable by evaluators" ON grade_details FOR SELECT USING (true);
