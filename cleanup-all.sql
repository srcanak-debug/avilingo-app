-- AVILINGO V2: TOTAL CLEANUP SCRIPT (EXAMS & TEMPLATES)
-- WARNING: This will wipe ALL candidate exams AND ALL 40+ exam templates.
-- Your Questions Bank, Users, and Organizations will remain completely safe.

-- 1. Delete all exam-related dependency data first
DELETE FROM exam_answers;
DELETE FROM grades;
DELETE FROM certificates;
DELETE FROM proctoring_events;
DELETE FROM violations;

-- 2. Delete all candidate exams
DELETE FROM exams;

-- 3. Delete all exam templates (the 40+ templates you saw in the UI)
DELETE FROM exam_templates;

-- Check done! You now have a 100% clean template and exam list.
