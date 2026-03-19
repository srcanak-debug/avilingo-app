-- ═══════════════════════════════════════════════════════════════
-- AVILINGO — DISABLE RLS (EMERGENCY DEBUG)
-- Disables Row Level Security on question-related tables 
-- ═══════════════════════════════════════════════════════════════

-- Disable RLS on all relevant tables
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_rubrics DISABLE ROW LEVEL SECURITY;

-- Grant broad permissions just in case
GRANT ALL ON public.questions TO anon, authenticated, postgres;
GRANT ALL ON public.question_analytics TO anon, authenticated, postgres;
GRANT ALL ON public.question_assignments TO anon, authenticated, postgres;
GRANT ALL ON public.departments TO anon, authenticated, postgres;
GRANT ALL ON public.sub_roles TO anon, authenticated, postgres;

-- Verification
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('questions', 'question_analytics', 'question_assignments');
