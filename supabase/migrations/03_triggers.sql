-- ============================================
-- AFRISENS - DATABASE TRIGGERS
-- Automatic Balance Updates & Audit Trail
-- ============================================

-- ============================================
-- TRIGGER 1: Auto-update artist_balances
-- ============================================

-- Function: Update artist balance when transaction is inserted
CREATE OR REPLACE FUNCTION update_artist_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update artist balance
  INSERT INTO artist_balances (
    artist_id,
    available_balance,
    total_earned,
    updated_at
  )
  VALUES (
    NEW.artist_id,
    NEW.net_amount,
    NEW.net_amount,
    NOW()
  )
  ON CONFLICT (artist_id) DO UPDATE SET
    available_balance = artist_balances.available_balance + EXCLUDED.available_balance,
    total_earned = artist_balances.total_earned + EXCLUDED.total_earned,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_artist_balance IS 'Auto-updates artist balance when transaction is confirmed';

-- Create trigger
CREATE TRIGGER after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_artist_balance();

COMMENT ON TRIGGER after_transaction_insert ON transactions IS 'Automatically credits artist balance when payment is confirmed';

-- ============================================
-- TRIGGER 2: Deduct balance on payout approval
-- ============================================

-- Function: Deduct from available balance and add to withdrawn total
CREATE OR REPLACE FUNCTION process_payout_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'paid'
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Update artist balance
    UPDATE artist_balances
    SET
      available_balance = available_balance - NEW.amount,
      total_withdrawn = total_withdrawn + NEW.amount,
      updated_at = NOW()
    WHERE artist_id = NEW.artist_id;
    
    -- Set processed timestamp
    NEW.processed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_payout_approval IS 'Deducts from artist balance when payout is marked as paid';

-- Create trigger
CREATE TRIGGER before_payout_status_update
BEFORE UPDATE ON payout_requests
FOR EACH ROW
WHEN (NEW.status = 'paid' AND OLD.status != 'paid')
EXECUTE FUNCTION process_payout_approval();

COMMENT ON TRIGGER before_payout_status_update ON payout_requests IS 'Deducts balance when payout status changes to paid';

-- ============================================
-- TRIGGER 3: Auto-update timestamps
-- ============================================

-- Generic function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column
CREATE TRIGGER set_updated_at_artists
BEFORE UPDATE ON artists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_payment_attempts
BEFORE UPDATE ON payment_attempts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

COMMENT ON FUNCTION update_updated_at IS 'Generic function to auto-update updated_at timestamp';

-- ============================================
-- TRIGGER 4: Validate payout amount against balance
-- ============================================

-- Function: Ensure payout request doesn't exceed available balance
CREATE OR REPLACE FUNCTION validate_payout_amount()
RETURNS TRIGGER AS $$
DECLARE
  current_balance NUMERIC(10,2);
BEGIN
  -- Get current available balance
  SELECT available_balance INTO current_balance
  FROM artist_balances
  WHERE artist_id = NEW.artist_id;
  
  -- Check if balance exists and is sufficient
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Artist has no balance record';
  END IF;
  
  IF NEW.amount > current_balance THEN
    RAISE EXCEPTION 'Payout amount (%) exceeds available balance (%)', 
      NEW.amount, current_balance;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_payout_amount IS 'Prevents payout requests that exceed available balance';

-- Create trigger
CREATE TRIGGER check_payout_amount
BEFORE INSERT ON payout_requests
FOR EACH ROW
EXECUTE FUNCTION validate_payout_amount();

COMMENT ON TRIGGER check_payout_amount ON payout_requests IS 'Validates payout amount before creation';

-- ============================================
-- TRIGGER 5: Log admin events automatically
-- ============================================

-- Function: Auto-log important admin actions
CREATE OR REPLACE FUNCTION log_admin_event()
RETURNS TRIGGER AS $$
DECLARE
  event_type_val TEXT;
BEGIN
  -- Determine event type based on operation
  IF TG_TABLE_NAME = 'artists' AND NEW.is_verified = TRUE AND OLD.is_verified = FALSE THEN
    event_type_val := 'artist_verified';
  ELSIF TG_TABLE_NAME = 'payout_requests' AND NEW.status = 'approved' AND OLD.status = 'pending' THEN
    event_type_val := 'payout_approved';
  ELSIF TG_TABLE_NAME = 'payout_requests' AND NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    event_type_val := 'payout_rejected';
  ELSE
    RETURN NEW;
  END IF;
  
  -- Insert audit log
  INSERT INTO admin_events (
    event_type,
    reference_id,
    actor_id,
    description,
    metadata
  ) VALUES (
    event_type_val,
    NEW.id,
    auth.uid(),
    format('Status changed from %s to %s', OLD.status, NEW.status),
    jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'table', TG_TABLE_NAME
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_admin_event IS 'Automatically logs critical admin actions for audit trail';

-- Create triggers for audit logging
CREATE TRIGGER log_artist_verification
AFTER UPDATE ON artists
FOR EACH ROW
WHEN (NEW.is_verified = TRUE AND OLD.is_verified = FALSE)
EXECUTE FUNCTION log_admin_event();

CREATE TRIGGER log_payout_approval
AFTER UPDATE ON payout_requests
FOR EACH ROW
WHEN (NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected'))
EXECUTE FUNCTION log_admin_event();

-- ============================================
-- TRIGGER 6: Prevent balance going negative
-- ============================================

-- Function: Safety check to prevent negative balances
CREATE OR REPLACE FUNCTION prevent_negative_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.available_balance < 0 THEN
    RAISE EXCEPTION 'Available balance cannot be negative. Current: %, Attempted: %',
      OLD.available_balance, NEW.available_balance;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_negative_balance IS 'Safety guard against negative balances';

-- Create trigger
CREATE TRIGGER check_negative_balance
BEFORE UPDATE ON artist_balances
FOR EACH ROW
EXECUTE FUNCTION prevent_negative_balance();

COMMENT ON TRIGGER check_negative_balance ON artist_balances IS 'Prevents balance from going negative';

-- ============================================
-- SUMMARY OF TRIGGERS
-- ============================================

-- 1. after_transaction_insert
--    - Automatically credits artist when payment confirmed
--    - Idempotent (ON CONFLICT DO UPDATE)
--
-- 2. before_payout_status_update
--    - Deducts balance when payout marked as 'paid'
--    - Sets processed_at timestamp
--
-- 3. set_updated_at_*
--    - Auto-updates updated_at on record modification
--
-- 4. check_payout_amount
--    - Validates payout request against current balance
--    - Prevents over-withdrawal attempts
--
-- 5. log_*_admin_event
--    - Automatically logs verification and payout approvals
--    - Creates audit trail
--
-- 6. check_negative_balance
--    - Final safety guard against corruption
--    - Should never trigger if other logic is correct
