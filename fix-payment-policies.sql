-- Fix Payment History Policies for Admin Panel
-- Run this in Supabase SQL Editor

-- First, check what policies exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'payment_history';

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can view own payment history" ON payment_history;
DROP POLICY IF EXISTS "Admin can read all payment history" ON payment_history;
DROP POLICY IF EXISTS "Admin can update payment history" ON payment_history;
DROP POLICY IF EXISTS "System can insert payment records" ON payment_history;
DROP POLICY IF EXISTS "System can update payment records" ON payment_history;

-- Create a comprehensive policy that works for admin
CREATE POLICY "Payment history access" 
ON payment_history FOR ALL
USING (
  -- Admin can access everything
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'diogo@diogoppedro.com'
  OR
  -- Users can access their own payments by user_id
  auth.uid() = user_id 
  OR
  -- Users can access their own payments by email
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Test admin access
SELECT COUNT(*) as payment_count FROM payment_history;

-- If the above still fails due to auth.users access, try this simpler version:
-- First, get your admin user ID
SELECT id, email FROM auth.users WHERE email = 'diogo@diogoppedro.com';

-- Then create a policy using the user ID (replace YOUR_ADMIN_UUID with the actual ID)
/*
DROP POLICY IF EXISTS "Payment history access" ON payment_history;

CREATE POLICY "Payment history access" 
ON payment_history FOR ALL
USING (
  -- Replace YOUR_ADMIN_UUID with your actual user ID from the query above
  auth.uid() = 'YOUR_ADMIN_UUID'::uuid
  OR
  -- Users can access their own payments
  auth.uid() = user_id 
);
*/