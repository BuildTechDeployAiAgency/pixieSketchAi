-- Admin Panel Database Policies for PixieSketch
-- This creates secure admin access for diogo@diogoppedro.com

-- First, create an admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if current user is the admin
  RETURN (
    SELECT email FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'diogo@diogoppedro.com'
  ) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Create admin-only policies for profiles table
-- Admin can read all profiles
CREATE POLICY "Admin can read all profiles" 
ON profiles FOR SELECT 
USING (is_admin());

-- Admin can update all profiles
CREATE POLICY "Admin can update all profiles" 
ON profiles FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Create admin-only policies for payment_history table
-- Admin can read all payment history
CREATE POLICY "Admin can read all payment history" 
ON payment_history FOR SELECT 
USING (is_admin());

-- Admin can update payment history (for status changes)
CREATE POLICY "Admin can update payment history" 
ON payment_history FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Create admin-only policies for sketches table
-- Admin can read all sketches
CREATE POLICY "Admin can read all sketches" 
ON sketches FOR SELECT 
USING (is_admin());

-- Admin can update all sketches
CREATE POLICY "Admin can update all sketches" 
ON sketches FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can delete any sketch (for moderation)
CREATE POLICY "Admin can delete all sketches" 
ON sketches FOR DELETE 
USING (is_admin());

-- Create admin utility functions
-- Function to reset all user credits (admin only)
CREATE OR REPLACE FUNCTION admin_reset_all_credits()
RETURNS integer AS $$
DECLARE
  affected_count integer;
BEGIN
  -- Security check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Reset all credits to 0
  UPDATE profiles 
  SET credits = 0, 
      updated_at = NOW()
  WHERE credits > 0;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to give credits to specific user (admin only)
CREATE OR REPLACE FUNCTION admin_give_credits(
  target_user_id uuid,
  credit_amount integer
)
RETURNS boolean AS $$
BEGIN
  -- Security check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Update user credits
  UPDATE profiles 
  SET credits = credits + credit_amount,
      updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive admin stats
CREATE OR REPLACE FUNCTION admin_get_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Security check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_credits', (SELECT COALESCE(SUM(credits), 0) FROM profiles),
    'total_revenue_cents', (SELECT COALESCE(SUM(amount), 0) FROM payment_history WHERE payment_status = 'completed'),
    'successful_payments', (SELECT COUNT(*) FROM payment_history WHERE payment_status = 'completed'),
    'failed_payments', (SELECT COUNT(*) FROM payment_history WHERE payment_status = 'failed'),
    'total_sketches', (SELECT COUNT(*) FROM sketches),
    'successful_sketches', (SELECT COUNT(*) FROM sketches WHERE status = 'completed'),
    'failed_sketches', (SELECT COUNT(*) FROM sketches WHERE status = 'failed'),
    'users_with_credits', (SELECT COUNT(*) FROM profiles WHERE credits > 0),
    'last_payment', (SELECT created_at FROM payment_history ORDER BY created_at DESC LIMIT 1),
    'last_sketch', (SELECT created_at FROM sketches ORDER BY created_at DESC LIMIT 1)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to admin functions
GRANT EXECUTE ON FUNCTION admin_reset_all_credits TO authenticated;
GRANT EXECUTE ON FUNCTION admin_give_credits TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_stats TO authenticated;

-- Create admin audit log table (optional but recommended)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID,
  target_email TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit log
CREATE POLICY "Admin can read audit log" 
ON admin_audit_log FOR SELECT 
USING (is_admin());

-- System can insert audit log entries
CREATE POLICY "System can insert audit log" 
ON admin_audit_log FOR INSERT 
WITH CHECK (true);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action_name TEXT,
  target_user_id UUID DEFAULT NULL,
  target_email TEXT DEFAULT NULL,
  action_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Only log if user is admin
  IF is_admin() THEN
    INSERT INTO admin_audit_log (
      admin_user_id,
      action,
      target_user_id,
      target_email,
      details
    ) VALUES (
      auth.uid(),
      action_name,
      target_user_id,
      target_email,
      action_details
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;

-- Trigger to log credit changes
CREATE OR REPLACE FUNCTION log_credit_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when admin changes credits
  IF is_admin() AND OLD.credits != NEW.credits THEN
    PERFORM log_admin_action(
      'credit_change',
      NEW.id,
      NEW.email,
      json_build_object(
        'old_credits', OLD.credits,
        'new_credits', NEW.credits,
        'change', NEW.credits - OLD.credits
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for credit change logging
DROP TRIGGER IF EXISTS admin_credit_change_log ON profiles;
CREATE TRIGGER admin_credit_change_log
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.credits IS DISTINCT FROM NEW.credits)
  EXECUTE FUNCTION log_credit_changes();

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);

-- Grant permissions
GRANT SELECT ON admin_audit_log TO authenticated;
GRANT ALL ON admin_audit_log TO service_role;