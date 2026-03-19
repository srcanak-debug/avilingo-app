-- ═══════════════════════════════════════════════════════════════
-- AVILINGO — PERFORMANCE v2
-- Correct column names, compression, and composite indexes
-- ═══════════════════════════════════════════════════════════════

-- Questions: fast role/section/level lookups
CREATE INDEX IF NOT EXISTS idx_q_role_section ON questions(role_tag, section) WHERE active = true AND is_latest = true;
CREATE INDEX IF NOT EXISTS idx_q_section_cefr ON questions(section, cefr_level) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_q_difficulty ON questions(section, difficulty) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_q_audio_null ON questions(id) WHERE audio_url IS NULL AND section = 'listening';

-- Exams: fast candidate and status lookups
CREATE INDEX IF NOT EXISTS idx_exams_candidate_status ON exams(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_exams_org ON exams(org_id, status);
CREATE INDEX IF NOT EXISTS idx_exams_created ON exams(created_at DESC);

-- Exam answers: fast per-exam, per-section queries
CREATE INDEX IF NOT EXISTS idx_ea_exam_section ON exam_answers(exam_id, section);
CREATE INDEX IF NOT EXISTS idx_ea_question ON exam_answers(question_id);

-- Proctoring
CREATE INDEX IF NOT EXISTS idx_pe_exam ON proctoring_events(exam_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_viol_exam ON violations(exam_id);

-- Grades
CREATE INDEX IF NOT EXISTS idx_grades_exam ON grades(exam_id, section);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Exam question sets
CREATE INDEX IF NOT EXISTS idx_eqs_exam_section ON exam_question_sets(exam_id, section);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);

-- Organizations
CREATE INDEX IF NOT EXISTS idx_orgs_name ON organizations(name);

-- Full text search on questions (GIN index)
CREATE INDEX IF NOT EXISTS idx_q_content_fts ON questions USING GIN (to_tsvector('english', content));

-- Verify
SELECT schemaname, tablename, indexname FROM pg_indexes
WHERE tablename IN ('questions','exams','exam_answers','users')
ORDER BY tablename, indexname;
