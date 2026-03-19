-- Migration: Comprehensive Security Hardening & RLS Overhaul
-- This script ensures that candidates can only see their own data and admins are restricted by role.

-- 1. Enable RLS on all relevant tables (just in case)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

-- 2. Clear existing loose policies to start fresh
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Candidates view own exams" ON exams;
DROP POLICY IF EXISTS "Public read questions" ON questions;
DROP POLICY IF EXISTS "Candidates can insert own answers" ON exam_answers;
DROP POLICY IF EXISTS "Candidates can view own answers" ON exam_answers;
DROP POLICY IF EXISTS "Candidates can update own answers" ON exam_answers;

-- 3. USERS Table Policies
-- Everyone can see their own profile
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Super admins can see all users
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- 4. EXAMS Table Policies
-- Candidates can view only their own assigned exams
CREATE POLICY "Candidates view own exams" ON exams
FOR SELECT USING (candidate_id = auth.uid());

-- Candidates can update their own exam started_at/completed_at
CREATE POLICY "Candidates update own exam timestamp" ON exams
FOR UPDATE USING (candidate_id = auth.uid())
WITH CHECK (candidate_id = auth.uid());

-- Admins can manage all exams
CREATE POLICY "Admins manage all exams" ON exams
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- 5. EXAM_ANSWERS Table Policies
-- Candidates can insert answers only if the exam is active
CREATE POLICY "Candidates insert answers active exam" ON exam_answers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM exams 
    WHERE exams.id = exam_id 
    AND exams.candidate_id = auth.uid() 
    AND exams.status IN ('pending', 'in_progress')
  )
);

-- Candidates can view their own answers
CREATE POLICY "Candidates view own answers" ON exam_answers
FOR SELECT USING (
  EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_id AND exams.candidate_id = auth.uid())
);

-- Candidates can update answers ONLY if exam is in_progress
CREATE POLICY "Candidates update answers active exam" ON exam_answers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM exams 
    WHERE exams.id = exam_id 
    AND exams.candidate_id = auth.uid() 
    AND exams.status = 'in_progress'
  )
);

-- 6. PROCTORING & VIOLATIONS
CREATE POLICY "Candidates insert proctoring" ON proctoring_events
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_id AND exams.candidate_id = auth.uid())
);

CREATE POLICY "Candidates insert violations" ON violations
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_id AND exams.candidate_id = auth.uid())
);

-- 7. QUESTIONS (Read-only for active exams)
-- Candidates can only see questions that are part of an exam they are currently taking
CREATE POLICY "Candidates read exam questions" ON questions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_answers 
    JOIN exams ON exams.id = exam_answers.exam_id
    WHERE exam_answers.question_id = questions.id
    AND exams.candidate_id = auth.uid()
  )
  OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- 8. ORGANIZATIONS & TEMPLATES
CREATE POLICY "Admins manage orgs" ON organizations FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));
-- 9. DATA INTEGRITY: Prevent answer manipulation after completion
CREATE OR REPLACE FUNCTION check_exam_active() 
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM exams 
    WHERE id = NEW.exam_id 
    AND status IN ('certified', 'completed')
  ) THEN
    RAISE EXCEPTION 'Exam is already completed or certified. Modifications are not allowed.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_exam_active ON exam_answers;
CREATE TRIGGER tr_check_exam_active
BEFORE INSERT OR UPDATE ON exam_answers
FOR EACH ROW EXECUTE FUNCTION check_exam_active();

-- 10. Audit Log (Super Admin view all)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view logs" ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));
