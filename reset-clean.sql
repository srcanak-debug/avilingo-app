-- ═══════════════════════════════════════════════════════════════
-- AVILINGO — CLEAN SLATE RESET
-- Clears all exam data, organizations, templates, and questions.
-- Keeps Auth users intact. Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- 1. Exam-related data (cascade order)
DELETE FROM grade_details WHERE grade_id IN (SELECT id FROM grades WHERE exam_id IN (SELECT id FROM exams));
DELETE FROM grades;
DELETE FROM proctoring_events;
DELETE FROM violations;
DELETE FROM exam_answers;
DELETE FROM exam_question_sets;
DELETE FROM exams;
DELETE FROM certificates;

-- 2. Question bank
DELETE FROM questions;

-- 3. Templates & Organizations
DELETE FROM exam_templates;
DELETE FROM organizations;

-- 4. Candidates (keep admin users)
DELETE FROM users WHERE role = 'candidate';

-- 5. Audit logs
DELETE FROM audit_logs;

-- Verify
SELECT 'questions' as tbl, count(*) FROM questions
UNION ALL SELECT 'exams', count(*) FROM exams
UNION ALL SELECT 'exam_templates', count(*) FROM exam_templates
UNION ALL SELECT 'organizations', count(*) FROM organizations;
