-- Phase 13: Performance Optimization - Tactical Indexing
-- Goal: Ensure sub-100ms response times for the modernized Admin panel.

-- Indexing for rapid Organization lookups
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);

-- Indexing for rapid User/Candidate management
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Indexing for Exam Results & Reports (heavy query area)
CREATE INDEX IF NOT EXISTS idx_exam_answers_exam_id ON exam_answers(exam_id);
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_completed_at ON exams(completed_at) WHERE status = 'completed';

-- Audit Logs (New Phase 13 Table)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT,
  metadata JSONB,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
