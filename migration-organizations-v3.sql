-- Migration for V3 Organization Management
-- Run this in your Supabase SQL Editor

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS contract_end_date timestamptz;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS country text;

-- Optional: Add index for domain searching
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
