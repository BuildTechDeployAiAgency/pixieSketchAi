-- Reset all user credits to 0 for testing
-- Run this in your Supabase SQL editor to reset all credits

-- Reset all profiles to 0 credits
UPDATE profiles 
SET credits = 0, 
    updated_at = NOW()
WHERE credits > 0;

-- Optional: Clear payment history for clean testing (CAUTION: This removes all payment records)
-- Uncomment the line below ONLY if you want to clear all payment history
-- DELETE FROM payment_history;

-- Show results
SELECT 
    email,
    credits,
    updated_at
FROM profiles 
ORDER BY updated_at DESC;