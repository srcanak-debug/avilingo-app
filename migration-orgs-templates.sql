-- ═══════════════════════════════════════════════════════════════
-- AVILINGO — NEW QUESTION TYPES + DEMO ORGANIZATIONS + TEMPLATES
-- Run AFTER reset-clean.sql and migration-performance-v2.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Ensure question type column allows new values (no hard enum in PG, just document)
COMMENT ON COLUMN questions.type IS 
'Allowed values: multiple_choice, fill_blank, true_false, error_correction, written_response, audio_response, short_answer, ordering';

-- 2. Demo Organizations
INSERT INTO organizations (id, name, subscription_type, credit_balance, contact_email) VALUES
('11111111-0000-0000-0000-000000000001', 'Turkish Airlines (Demo)', 'enterprise', 1000, 'demo@thy.com'),
('11111111-0000-0000-0000-000000000002', 'Pegasus Cargo (Demo)', 'standard', 500, 'demo@pegasus.com'),
('11111111-0000-0000-0000-000000000003', 'Havelsan Teknik (Demo)', 'standard', 300, 'demo@havelsan.com');

-- 3. Exam Templates (one per role per org)
INSERT INTO exam_templates (
  name, org_id, role_profile,
  grammar_count, reading_count, writing_count, speaking_count, listening_count,
  weight_grammar, weight_reading, weight_writing, weight_speaking, weight_listening,
  time_limit_mins, passing_cefr, proctoring_enabled, attempts_allowed,
  writing_timer_mins, speaking_attempts, listening_single_play
) VALUES
-- Flight Deck (Pilot/Co-pilot)
('Flight Deck English Assessment',  '11111111-0000-0000-0000-000000000001', 'flight_deck',
  15, 5, 3, 4, 8,   10, 20, 20, 40, 10,  90, 'B2', true, 1, 3.5, 3, true),

-- Cabin Crew
('Cabin Crew English Assessment',   '11111111-0000-0000-0000-000000000001', 'cabin_crew',
  12, 5, 3, 5, 5,   10, 15, 20, 45, 10,  75, 'B1', true, 1, 3.5, 3, true),

-- ATC
('ATC English Proficiency Test',    '11111111-0000-0000-0000-000000000001', 'atc',
  10, 5, 3, 5, 10,   5, 15, 20, 50, 10,  90, 'B2', true, 1, 3.5, 3, true),

-- Maintenance
('AME English Proficiency Test',    '11111111-0000-0000-0000-000000000003', 'maintenance',
  15, 8, 5, 3, 4,   15, 25, 30, 15, 15,  80, 'B1', true, 1, 5, 2, true),

-- Ground Staff
('Ground Operations English Test',  '11111111-0000-0000-0000-000000000002', 'ground_staff',
  12, 5, 4, 4, 5,   15, 20, 25, 25, 15,  70, 'B1', true, 1, 4, 2, true),

-- General (all roles)
('General Aviation English Test',   '11111111-0000-0000-0000-000000000001', 'general',
  15, 5, 3, 4, 8,   10, 20, 20, 40, 10,  90, 'B1', true, 1, 3.5, 3, true);
