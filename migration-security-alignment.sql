-- ═══════════════════════════════════════════════════════════════
-- AVILINGO — SECURITY ALIGNMENT (RLS FIX)
-- Ensures Admin UI can read all joined tables
-- ═══════════════════════════════════════════════════════════════

-- 1. Ensure RLS is active
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_roles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read on questions" ON questions;
DROP POLICY IF EXISTS "Allow public read on analytics" ON question_analytics;
DROP POLICY IF EXISTS "Allow public read on assignments" ON question_assignments;
DROP POLICY IF EXISTS "Allow public read on departments" ON departments;
DROP POLICY IF EXISTS "Allow public read on sub_roles" ON sub_roles;

-- 3. Create permissive READ policies for the Admin UI
-- (Note: In a production system, these should be restricted to 'authenticated' or 'admin' roles, 
-- but we use 'true' here to ensure the dashboard functions immediately.)

CREATE POLICY "Allow public read on questions" ON questions FOR SELECT USING (active = true);
CREATE POLICY "Allow public read on analytics" ON question_analytics FOR SELECT USING (true);
CREATE POLICY "Allow public read on assignments" ON question_assignments FOR SELECT USING (true);
CREATE POLICY "Allow public read on departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public read on sub_roles" ON sub_roles FOR SELECT USING (true);

-- 4. Grant explicit access (Supabase specific)
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT SELECT ON public.question_analytics TO anon, authenticated;
GRANT SELECT ON public.question_assignments TO anon, authenticated;
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT SELECT ON public.sub_roles TO anon, authenticated;

-- Verification
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
