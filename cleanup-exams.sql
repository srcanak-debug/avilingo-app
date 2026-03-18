-- AVILINGO V2: CLEANUP EXAMS SCRIPT
-- Run this script in your Supabase SQL Editor to wipe out all testing and candidate exams.
-- Note: This does NOT delete your exam templates, questions, users, or organizations. You will start with a clean slate for exams.

-- 1. Delete dependent table data first to avoid any foreign key constraint issues
DELETE FROM exam_answers;
DELETE FROM grades;
DELETE FROM certificates;
DELETE FROM proctoring_events;
DELETE FROM violations;

-- 2. Delete all exams
DELETE FROM exams;

-- Check done!
