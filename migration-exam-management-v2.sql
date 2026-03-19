-- Migration: Modernize Exam Management (v2)
-- Adding advanced management fields to the exams table

ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS field_area TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS duration_mins INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grammar_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS writing_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS speaking_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS listening_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS threshold_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS weighting_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS proctoring_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assigned_instructor_id UUID REFERENCES users(id);

-- Update existing exams with some defaults if necessary
UPDATE exams SET 
  grammar_count = 15,
  reading_count = 5,
  writing_count = 2,
  speaking_count = 3,
  listening_count = 6
WHERE grammar_count IS NULL OR grammar_count = 0;
