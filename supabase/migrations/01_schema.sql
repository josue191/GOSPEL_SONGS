-- ============================================
-- AFRISENS - GOSPEL SONGS DONATION PLATFORM
-- DATABASE SCHEMA - SUPABASE/POSTGRESQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: profiles - User Identity & Roles
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('guest', 'artist')),
  device_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT role_device_id_check CHECK (
    (role = 'guest' AND device_id IS NOT NULL) OR
    (role = 'artist' AND device_id IS NULL)
  )
);

COMMENT ON TABLE profiles IS 'User profiles with role-based access (guest = donor, artist = singer)';
COMMENT ON COLUMN profiles.device_id IS 'Unique device identifier for guest users (no account required)';

-- ============================================
-- TABLE 2: artists - Gospel Artist Profiles
-- ============================================
CREATE TABLE artists (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  church_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  verification_video_url TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE artists IS 'Public profiles for gospel artists with verification status';
COMMENT ON COLUMN artists.verification_video_url IS 'Video proof: "This is my official gospel page"';
COMMENT ON COLUMN artists.is_verified IS 'Manual admin verification - REQUIRED to receive donations';

-- ============================================
-- TABLE 3: songs - Audio Content
-- ============================================
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  duration_seconds INTEGER,
  is_public BOOLEAN DEFAULT TRUE,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT songs_title_check CHECK (LENGTH(title) > 0)
);

CREATE INDEX idx_songs_artist_id ON songs(artist_id);
CREATE INDEX idx_songs_public ON songs(is_public) WHERE is_public = TRUE;

COMMENT ON TABLE songs IS 'Gospel songs uploaded by artists - simple hosting + playback';

-- ============================================
-- TABLE 4: payment_attempts - Payment Tracking
-- ============================================
CREATE TABLE payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id),
  device_id TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
  status TEXT NOT NULL CHECK (status IN ('initiated', 'pending', 'success', 'failed')),
  cinetpay_reference TEXT UNIQUE,
  donor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_attempts_device_id ON payment_attempts(device_id);
CREATE INDEX idx_payment_attempts_artist_id ON payment_attempts(artist_id);
CREATE INDEX idx_payment_attempts_status ON payment_attempts(status);

COMMENT ON TABLE payment_attempts IS 'CRITICAL: Every payment click creates a record here - tracks entire payment lifecycle';
COMMENT ON COLUMN payment_attempts.cinetpay_reference IS 'CinetPay transaction reference - UNIQUE for idempotence';

-- ============================================
-- TABLE 5: transactions - CONFIRMED MONEY ONLY
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_attempt_id UUID REFERENCES payment_attempts(id),
  artist_id UUID NOT NULL REFERENCES artists(id),
  
  -- Money breakdown
  gross_amount NUMERIC(10,2) NOT NULL CHECK (gross_amount > 0),
  platform_fee NUMERIC(10,2) NOT NULL CHECK (platform_fee >= 0),
  provider_fee NUMERIC(10,2) NOT NULL CHECK (provider_fee >= 0),
  net_amount NUMERIC(10,2) NOT NULL CHECK (net_amount >= 0),
  
  currency TEXT DEFAULT 'USD',
  donor_name TEXT,
  provider_reference TEXT UNIQUE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation: gross = net + fees
  CONSTRAINT transaction_amount_check CHECK (
    gross_amount = net_amount + platform_fee + provider_fee
  )
);

CREATE INDEX idx_transactions_artist_id ON transactions(artist_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE UNIQUE INDEX idx_transactions_provider_ref ON transactions(provider_reference);

COMMENT ON TABLE transactions IS 'SACRED TABLE: Only written via webhooks (service_role). Source of truth for money.';
COMMENT ON COLUMN transactions.provider_reference IS 'CinetPay unique ID - prevents duplicate credits';

-- ============================================
-- TABLE 6: artist_balances - Calculated Solde
-- ============================================
CREATE TABLE artist_balances (
  artist_id UUID PRIMARY KEY REFERENCES artists(id) ON DELETE CASCADE,
  available_balance NUMERIC(10,2) DEFAULT 0 CHECK (available_balance >= 0),
  total_earned NUMERIC(10,2) DEFAULT 0 CHECK (total_earned >= 0),
  total_withdrawn NUMERIC(10,2) DEFAULT 0 CHECK (total_withdrawn >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artist_balances_updated ON artist_balances(updated_at DESC);

COMMENT ON TABLE artist_balances IS 'Auto-updated by trigger. Never modify manually.';
COMMENT ON COLUMN artist_balances.available_balance IS 'Current withdrawable amount';
COMMENT ON COLUMN artist_balances.total_earned IS 'Lifetime net earnings';

-- ============================================
-- TABLE 7: payout_requests - Withdrawal Requests
-- ============================================
CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  mobile_money_number TEXT,
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Ensure artist can't request more than balance
  CONSTRAINT payout_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payout_requests_artist_id ON payout_requests(artist_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);

COMMENT ON TABLE payout_requests IS 'Artist withdrawal requests - manual approval at MVP';
COMMENT ON COLUMN payout_requests.status IS 'pending → approved/rejected → paid';

-- ============================================
-- TABLE 8: payout_receipts - Trust & Transparency
-- ============================================
CREATE TABLE payout_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_request_id UUID NOT NULL REFERENCES payout_requests(id),
  receipt_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payout_receipts_request_id ON payout_receipts(payout_request_id);

COMMENT ON TABLE payout_receipts IS 'CREDIBILITY LAYER: Screenshots of Mobile Money transfers';
COMMENT ON COLUMN payout_receipts.receipt_url IS 'URL to uploaded Mobile Money transfer proof';

-- ============================================
-- TABLE 9: admin_events - Audit Trail
-- ============================================
CREATE TABLE admin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'artist_verified', 
    'artist_suspended', 
    'payout_approved', 
    'payout_rejected',
    'manual_balance_adjustment',
    'dispute_logged'
  )),
  reference_id UUID,
  actor_id UUID REFERENCES auth.users(id),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_events_type ON admin_events(event_type);
CREATE INDEX idx_admin_events_created ON admin_events(created_at DESC);

COMMENT ON TABLE admin_events IS 'Legal/audit trail for all critical admin actions';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Fast lookup for guest donation history
CREATE INDEX idx_payment_attempts_device_created ON payment_attempts(device_id, created_at DESC);

-- Fast artist dashboard queries
CREATE INDEX idx_transactions_artist_created ON transactions(artist_id, created_at DESC);
