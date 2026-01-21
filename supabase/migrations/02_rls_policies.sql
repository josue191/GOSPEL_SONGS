-- ============================================
-- AFRISENS - ROW LEVEL SECURITY POLICIES
-- The Database is the Police. Not the App.
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: profiles
-- ============================================

-- Users can read their own profile
CREATE POLICY "read_own_profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can insert their own profile during registration
CREATE POLICY "insert_own_profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "update_own_profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- DELETE blocked (no policy = no access)

-- ============================================
-- TABLE: artists - PUBLIC PROFILES
-- ============================================

-- Anyone (even guests) can view all artist profiles
CREATE POLICY "public_read_artists"
ON artists
FOR SELECT
USING (TRUE);

-- Artists can insert their own profile
CREATE POLICY "artist_self_insert"
ON artists
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Artists can update their own profile
CREATE POLICY "artist_self_update"
ON artists
FOR UPDATE
USING (auth.uid() = id);

-- DELETE blocked

-- ============================================
-- TABLE: songs
-- ============================================

-- Public can read public songs
CREATE POLICY "public_read_public_songs"
ON songs
FOR SELECT
USING (is_public = TRUE);

-- Artists can read their own songs (even if not public)
CREATE POLICY "artist_read_own_songs"
ON songs
FOR SELECT
USING (auth.uid() = artist_id);

-- Artists can insert their own songs
CREATE POLICY "artist_insert_own_songs"
ON songs
FOR INSERT
WITH CHECK (auth.uid() = artist_id);

-- Artists can update their own songs
CREATE POLICY "artist_update_own_songs"
ON songs
FOR UPDATE
USING (auth.uid() = artist_id);

-- Artists can delete their own songs
CREATE POLICY "artist_delete_own_songs"
ON songs
FOR DELETE
USING (auth.uid() = artist_id);

-- ============================================
-- TABLE: payment_attempts - GUEST ACCESS
-- ============================================

-- CRITICAL: Anyone (guests included) can create payment attempts
CREATE POLICY "anyone_create_payment_attempt"
ON payment_attempts
FOR INSERT
WITH CHECK (TRUE);

-- Guests can read their own attempts via device_id
-- Note: This requires custom header injection in Supabase client
CREATE POLICY "guest_read_own_attempts"
ON payment_attempts
FOR SELECT
USING (
  -- Artist reading their donations
  auth.uid() = artist_id
  OR
  -- Guest reading via device_id (set via custom header or function parameter)
  device_id = current_setting('request.headers', true)::json->>'x-device-id'
);

-- UPDATE/DELETE blocked (status updates via Edge Functions only)

-- ============================================
-- TABLE: transactions - SACRED MONEY TABLE
-- ============================================

-- Artists can read their own transactions
CREATE POLICY "artist_read_own_transactions"
ON transactions
FOR SELECT
USING (auth.uid() = artist_id);

-- INSERT blocked for all users
-- Only service_role (Edge Functions) can insert
CREATE POLICY "block_insert_transactions"
ON transactions
FOR INSERT
WITH CHECK (FALSE);

-- UPDATE/DELETE blocked

-- ============================================
-- TABLE: artist_balances - AUTO-CALCULATED
-- ============================================

-- Artists can read their own balance
CREATE POLICY "artist_read_own_balance"
ON artist_balances
FOR SELECT
USING (auth.uid() = artist_id);

-- INSERT/UPDATE blocked (trigger only)
CREATE POLICY "block_balance_write"
ON artist_balances
FOR ALL
WITH CHECK (FALSE);

-- ============================================
-- TABLE: payout_requests
-- ============================================

-- Artists can read their own payout requests
CREATE POLICY "artist_read_own_payouts"
ON payout_requests
FOR SELECT
USING (auth.uid() = artist_id);

-- Only VERIFIED artists can create payout requests
CREATE POLICY "verified_artist_create_payout"
ON payout_requests
FOR INSERT
WITH CHECK (
  auth.uid() = artist_id
  AND EXISTS (
    SELECT 1 FROM artists
    WHERE artists.id = artist_id
    AND is_verified = TRUE
  )
);

-- UPDATE/DELETE blocked (admin only via service_role)

-- ============================================
-- TABLE: payout_receipts
-- ============================================

-- Artists can read receipts for their own payouts
CREATE POLICY "artist_read_own_receipts"
ON payout_receipts
FOR SELECT
USING (
  payout_request_id IN (
    SELECT id FROM payout_requests
    WHERE artist_id = auth.uid()
  )
);

-- INSERT/UPDATE/DELETE blocked (admin only via service_role)

-- ============================================
-- TABLE: admin_events - ADMIN ONLY
-- ============================================

-- All operations blocked for regular users
-- Only service_role can read/write
CREATE POLICY "admin_only"
ON admin_events
FOR ALL
WITH CHECK (FALSE);

-- ============================================
-- HELPER FUNCTION: Get Device ID from Custom Header
-- ============================================

-- This function can be used in queries to safely get device_id
CREATE OR REPLACE FUNCTION get_device_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.headers', true)::json->>'x-device-id';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_device_id IS 'Safely extracts device_id from custom HTTP header';

-- ============================================
-- SECURITY NOTES
-- ============================================

-- 1. Service Role Key Usage:
--    - Edge Functions use service_role to bypass RLS
--    - NEVER expose service_role key to mobile app
--    - Only anon key in mobile app
--
-- 2. Device ID Header:
--    - Set via Supabase client custom headers
--    - Example: supabase.auth.setCustomHeader('x-device-id', deviceId)
--
-- 3. Financial Tables:
--    - transactions: READ by artist, WRITE by service_role only
--    - artist_balances: READ by artist, WRITE by trigger only
--    - payout_receipts: READ by artist, WRITE by admin only
--
-- 4. Guest Access:
--    - Can read: artists, songs (public), payment_attempts (own)
--    - Can write: payment_attempts
--    - Cannot: access money tables, other users' data
--
-- 5. Artist Access:
--    - Can read: own profile, transactions, balance, payouts
--    - Can write: profile, songs, payment_attempts (donations received)
--    - Cannot: modify balances, approve payouts, access other artists' money
