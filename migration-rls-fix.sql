-- Migration: Fix RLS for Exam Data Persistence
-- This script adds the missing policies to allow candidates to save answers and proctoring data.

-- 1. exam_answers
DROP POLICY IF EXISTS "Candidates can insert own answers" ON exam_answers;
CREATE POLICY "Candidates can insert own answers" ON exam_answers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_id
    AND exams.candidate_id = auth.uid()
    AND exams.status IN ('pending', 'in_progress')
  )
);

DROP POLICY IF EXISTS "Candidates can view own answers" ON exam_answers;
CREATE POLICY "Candidates can view own answers" ON exam_answers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_id
    AND exams.candidate_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Candidates can update own answers" ON exam_answers;
CREATE POLICY "Candidates can update own answers" ON exam_answers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_id
    AND exams.candidate_id = auth.uid()
    AND exams.status IN ('pending', 'in_progress')
  )
);

-- 2. proctoring_events
DROP POLICY IF EXISTS "Candidates can insert own proctoring events" ON proctoring_events;
CREATE POLICY "Candidates can insert own proctoring events" ON proctoring_events
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_id
    AND exams.candidate_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Candidates can view own proctoring events" ON proctoring_events;
CREATE POLICY "Candidates can view own proctoring events" ON proctoring_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_id
    AND exams.candidate_id = auth.uid()
  )
);

-- 3. violations
DROP POLICY IF EXISTS "Candidates can insert own violations" ON violations;
CREATE POLICY "Candidates can insert own violations" ON violations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_id
    AND exams.candidate_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Candidates can view own violations" ON violations;
CREATE POLICY "Candidates can view own violations" ON violations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_id
    AND exams.candidate_id = auth.uid()
  )
);

-- 4. Admin Access (Allow super_admin to view everything)
-- Note: Service Role bypasses RLS, but for the Admin UI (which uses anon key + JS client):
DROP POLICY IF EXISTS "Admins can view all answers" ON exam_answers;
CREATE POLICY "Admins can view all answers" ON exam_answers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Admins can view all proctoring" ON proctoring_events;
CREATE POLICY "Admins can view all proctoring" ON proctoring_events
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Admins can view all violations" ON violations;
CREATE POLICY "Admins can view all violations" ON violations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Update exams status check to include 'scheduled' if it's being used
-- ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_status_check;
-- ALTER TABLE exams ADD CONSTRAINT exams_status_check CHECK (status IN ('pending','scheduled','in_progress','completed','invalidated','grading','certified','cancelled'));
