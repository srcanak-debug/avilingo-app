-- Migration for Exam Wizard Enhancements
ALTER TABLE exam_templates ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'corporate';
ALTER TABLE exam_templates ADD COLUMN IF NOT EXISTS registration_fields JSONB DEFAULT '{"name": true, "email": true, "phone": true}';
ALTER TABLE exam_templates ADD COLUMN IF NOT EXISTS public_token TEXT;

-- Index for public registration lookups
CREATE INDEX IF NOT EXISTS idx_exam_templates_public_token ON exam_templates(public_token);
