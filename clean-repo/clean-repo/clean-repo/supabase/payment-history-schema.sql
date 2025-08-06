-- Payment History Table Schema
-- Run this in your Supabase SQL editor

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  credits_purchased INTEGER NOT NULL,
  package_name TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_email ON payment_history(customer_email);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_session ON payment_history(stripe_session_id);

-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_history
-- Users can only view their own payment history
CREATE POLICY "Users can view own payment history" 
ON payment_history FOR SELECT 
USING (
  auth.uid() = user_id OR 
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Only system can insert payment records (via service role)
CREATE POLICY "System can insert payment records" 
ON payment_history FOR INSERT 
WITH CHECK (true); -- Service role bypasses this anyway

-- Only system can update payment records
CREATE POLICY "System can update payment records" 
ON payment_history FOR UPDATE 
USING (true) -- Service role bypasses this anyway
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER payment_history_updated_at
BEFORE UPDATE ON payment_history
FOR EACH ROW
EXECUTE FUNCTION update_payment_history_updated_at();

-- Grant permissions
GRANT SELECT ON payment_history TO authenticated;
GRANT ALL ON payment_history TO service_role;

-- Optional: Create a view for user-friendly payment history
CREATE OR REPLACE VIEW user_payment_history AS
SELECT 
  id,
  stripe_session_id,
  amount / 100.0 AS amount_dollars,
  currency,
  credits_purchased,
  package_name,
  payment_status,
  created_at,
  CASE 
    WHEN payment_status = 'completed' THEN '✅ Completed'
    WHEN payment_status = 'pending' THEN '⏳ Pending'
    WHEN payment_status = 'failed' THEN '❌ Failed'
    WHEN payment_status = 'refunded' THEN '↩️ Refunded'
    ELSE payment_status
  END AS status_display
FROM payment_history
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON user_payment_history TO authenticated;