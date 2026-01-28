-- ============================================
-- MIGRATION: Enhanced Artist Registration
-- Add fields for improved registration flow
-- ============================================

-- Add new columns to artists table for enhanced registration
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F')),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS province TEXT DEFAULT 'Nord-Kivu',
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Goma',
ADD COLUMN IF NOT EXISTS commune TEXT,
ADD COLUMN IF NOT EXISTS avenue TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS voter_card_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN artists.first_name IS 'Artist legal first name';
COMMENT ON COLUMN artists.last_name IS 'Artist legal last name';
COMMENT ON COLUMN artists.gender IS 'Artist gender: M (Masculin) or F (Féminin)';
COMMENT ON COLUMN artists.birth_date IS 'Artist date of birth';
COMMENT ON COLUMN artists.phone IS 'Artist phone number (format: +243 XXX XXX XXX)';
COMMENT ON COLUMN artists.address IS 'Full address string for display';
COMMENT ON COLUMN artists.province IS 'Province (default: Nord-Kivu)';
COMMENT ON COLUMN artists.city IS 'City (default: Goma)';
COMMENT ON COLUMN artists.commune IS 'Commune/Quarter in Goma';
COMMENT ON COLUMN artists.avenue IS 'Street/Avenue name';
COMMENT ON COLUMN artists.number IS 'House/Building number (optional)';
COMMENT ON COLUMN artists.voter_card_url IS 'Path to voter card image in Supabase Storage';
COMMENT ON COLUMN artists.selfie_url IS 'Path to artist selfie image in Supabase Storage';

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_artists_phone ON artists(phone);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_artists_location ON artists(province, city, commune);
