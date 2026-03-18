-- ═══════════════════════════════════════════════════════════════
-- ROLE-BASED QUESTION ISOLATION
-- Ensures questions are tagged to specific roles and
-- exam question selection respects role boundaries
-- ═══════════════════════════════════════════════════════════════

-- 1. Add role_tag column to questions
-- Values: 'general', 'flight_deck', 'cabin_crew', 'atc', 'maintenance', 'ground_staff'
-- 'general' means the question can appear in ANY role's exam
ALTER TABLE questions ADD COLUMN IF NOT EXISTS role_tag text DEFAULT 'general';

-- 2. Create exam_question_sets table (if not exists)
CREATE TABLE IF NOT EXISTS exam_question_sets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id),
  section text NOT NULL,
  question_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eqs_exam_section ON exam_question_sets(exam_id, section);
ALTER TABLE exam_question_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Candidates can view own exam questions" ON exam_question_sets 
  FOR SELECT USING (
    exam_id IN (SELECT id FROM exams WHERE candidate_id = auth.uid())
  );

-- 3. Tag existing maintenance questions
-- (Match by aircraft_context and competency_tag patterns)
UPDATE questions SET role_tag = 'maintenance'
WHERE role_tag = 'general' AND (
  aircraft_context IN ('engine', 'airframe', 'landing_gear', 'hydraulic', 'fuel_system')
  OR competency_tag IN ('maintenance_log', 'technical_manual', 'incident_report', 'technical_description')
  OR content ILIKE '%maintenance%'
  OR content ILIKE '%technician%'
  OR content ILIKE '%mechanic%'
  OR content ILIKE '%hangar%'
  OR content ILIKE '%torque%'
  OR content ILIKE '%engine oil%'
  OR content ILIKE '%brake pad%'
  OR content ILIKE '%corrosion%'
  OR content ILIKE '%lubrication%'
  OR content ILIKE '%FOD%'
  OR content ILIKE '%tool%control%'
  OR content ILIKE '%lock%wire%'
  OR content ILIKE '%calibration%'
  OR content ILIKE '%cowling%'
  OR content ILIKE '%drain plug%'
  OR content ILIKE '%sealant%'
  OR content ILIKE '%work order%'
  OR content ILIKE '%AMM%'
  OR content ILIKE '%SRM%'
);

-- 4. Keep some questions explicitly as 'general' (shared across all roles)
-- These are questions about generic English grammar, basic safety, and NOTAMs
-- that any aviation professional should know
UPDATE questions SET role_tag = 'general'
WHERE role_tag = 'general' AND (
  competency_tag IN ('structural_accuracy', 'tense_usage', 'conditional_forms', 'passive_voice', 'phraseology_grammar')
  AND aircraft_context IN ('general', '')
  AND content NOT ILIKE '%maintenance%'
  AND content NOT ILIKE '%technician%'
  AND content NOT ILIKE '%hangar%'
  AND content NOT ILIKE '%pilot%'
  AND content NOT ILIKE '%cabin%'
  AND content NOT ILIKE '%tower%'
  AND content NOT ILIKE '%controller%'
);

-- 5. Verify distribution
SELECT role_tag, section, count(*) 
FROM questions 
WHERE active = true AND is_latest = true
GROUP BY role_tag, section
ORDER BY role_tag, section;
