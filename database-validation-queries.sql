-- Database Validation Queries for PixieSketch Credit System Testing
-- Run these in Supabase SQL Editor during/after testing

-- ============================================================================
-- STEP 1: Verify Credit Reset (Run this AFTER resetting credits)
-- ============================================================================

-- Check all user credits are reset to 0
SELECT 
    email,
    credits,
    updated_at,
    CASE 
        WHEN credits = 0 THEN '✅ RESET OK'
        ELSE '❌ NOT RESET'
    END as reset_status
FROM profiles 
ORDER BY updated_at DESC;

-- Count users with non-zero credits (should be 0 after reset)
SELECT 
    COUNT(*) as users_with_credits,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ ALL USERS RESET'
        ELSE '❌ SOME USERS STILL HAVE CREDITS'
    END as validation_result
FROM profiles 
WHERE credits > 0;

-- ============================================================================
-- STEP 2: Payment Purchase Validation (Run after each purchase)
-- ============================================================================

-- View recent payment history
SELECT 
    customer_email,
    amount / 100.0 as amount_dollars,
    credits_purchased,
    package_name,
    payment_status,
    created_at,
    CASE 
        WHEN amount = 100 AND credits_purchased = 1 THEN '✅ $1.00 = 1 credit OK'
        WHEN amount = 499 AND credits_purchased = 10 THEN '✅ $4.99 = 10 credits OK'
        WHEN amount = 999 AND credits_purchased = 25 THEN '✅ $9.99 = 25 credits OK'
        ELSE '❌ INCORRECT CREDIT AMOUNT'
    END as validation_status
FROM payment_history 
ORDER BY created_at DESC
LIMIT 10;

-- Check for duplicate payment sessions (should be 0)
SELECT 
    stripe_session_id,
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ NO DUPLICATES'
        ELSE '❌ DUPLICATE FOUND!'
    END as idempotency_check
FROM payment_history 
GROUP BY stripe_session_id 
HAVING COUNT(*) > 1;

-- ============================================================================
-- STEP 3: Credit Balance Validation (Run after purchases)
-- ============================================================================

-- Check user credit balances match payment history
WITH user_payments AS (
    SELECT 
        COALESCE(ph.user_id, p.id) as user_id,
        p.email,
        p.credits as current_credits,
        COALESCE(SUM(ph.credits_purchased), 0) as total_purchased
    FROM profiles p
    LEFT JOIN payment_history ph ON p.id = ph.user_id 
    WHERE ph.payment_status = 'completed' OR ph.user_id IS NULL
    GROUP BY p.id, p.email, p.credits
)
SELECT 
    email,
    current_credits,
    total_purchased,
    (total_purchased - current_credits) as credits_used,
    CASE 
        WHEN current_credits <= total_purchased THEN '✅ BALANCE OK'
        ELSE '❌ MORE CREDITS THAN PURCHASED!'
    END as balance_validation
FROM user_payments
ORDER BY email;

-- ============================================================================
-- STEP 4: Credit Usage Tracking (Run during/after image processing)
-- ============================================================================

-- Count sketch processing attempts
SELECT 
    s.user_id,
    p.email,
    COUNT(s.id) as total_sketches,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as successful_sketches,
    COUNT(CASE WHEN s.status = 'failed' THEN 1 END) as failed_sketches,
    COUNT(CASE WHEN s.status = 'processing' THEN 1 END) as processing_sketches
FROM sketches s
JOIN profiles p ON s.user_id = p.id
GROUP BY s.user_id, p.email
ORDER BY total_sketches DESC;

-- Verify credit deduction matches successful processing
WITH sketch_summary AS (
    SELECT 
        s.user_id,
        p.email,
        p.credits as current_credits,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as successful_sketches,
        COALESCE(SUM(ph.credits_purchased), 0) as total_purchased
    FROM profiles p
    LEFT JOIN sketches s ON p.id = s.user_id
    LEFT JOIN payment_history ph ON p.id = ph.user_id AND ph.payment_status = 'completed'
    GROUP BY p.id, p.email, p.credits
)
SELECT 
    email,
    current_credits,
    total_purchased,
    successful_sketches,
    (total_purchased - successful_sketches) as expected_credits,
    CASE 
        WHEN current_credits = (total_purchased - successful_sketches) THEN '✅ CREDIT USAGE OK'
        ELSE '❌ CREDIT MISMATCH!'
    END as usage_validation
FROM sketch_summary
WHERE total_purchased > 0 OR successful_sketches > 0
ORDER BY email;

-- ============================================================================
-- STEP 5: Real-time Update Validation
-- ============================================================================

-- Check recent profile updates (should happen after purchases/processing)
SELECT 
    email,
    credits,
    updated_at,
    created_at,
    (updated_at - created_at) as time_since_creation
FROM profiles 
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================================
-- STEP 6: Error Case Validation
-- ============================================================================

-- Find any orphaned or inconsistent records
SELECT 
    'Sketches without users' as issue_type,
    COUNT(*) as count
FROM sketches s
LEFT JOIN profiles p ON s.user_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'Payments without users' as issue_type,
    COUNT(*) as count
FROM payment_history ph
LEFT JOIN profiles p ON ph.user_id = p.id
WHERE ph.user_id IS NOT NULL AND p.id IS NULL

UNION ALL

SELECT 
    'Failed sketches' as issue_type,
    COUNT(*) as count
FROM sketches
WHERE status = 'failed'

UNION ALL

SELECT 
    'Failed payments' as issue_type,
    COUNT(*) as count
FROM payment_history
WHERE payment_status = 'failed';

-- ============================================================================
-- STEP 7: Final System Health Check
-- ============================================================================

-- Comprehensive system status
SELECT 
    'Total Users' as metric,
    COUNT(*)::text as value
FROM profiles

UNION ALL

SELECT 
    'Users with Credits' as metric,
    COUNT(*)::text as value
FROM profiles
WHERE credits > 0

UNION ALL

SELECT 
    'Total Credits in System' as metric,
    SUM(credits)::text as value
FROM profiles

UNION ALL

SELECT 
    'Total Successful Payments' as metric,
    COUNT(*)::text as value
FROM payment_history
WHERE payment_status = 'completed'

UNION ALL

SELECT 
    'Total Credits Sold' as metric,
    SUM(credits_purchased)::text as value
FROM payment_history
WHERE payment_status = 'completed'

UNION ALL

SELECT 
    'Total Revenue (cents)' as metric,
    SUM(amount)::text as value
FROM payment_history
WHERE payment_status = 'completed'

UNION ALL

SELECT 
    'Successful Transformations' as metric,
    COUNT(*)::text as value
FROM sketches
WHERE status = 'completed'

UNION ALL

SELECT 
    'Failed Transformations' as metric,
    COUNT(*)::text as value
FROM sketches
WHERE status = 'failed';

-- ============================================================================
-- TESTING CHECKLIST QUERIES
-- ============================================================================

-- Quick validation for each test phase:

-- Phase 1 Check: After credit reset
-- SELECT COUNT(*) as users_with_zero_credits FROM profiles WHERE credits = 0;

-- Phase 2 Check: After $1.00 purchase  
-- SELECT credits FROM profiles WHERE email = 'your-test-email@example.com';

-- Phase 3 Check: After image processing
-- SELECT status, COUNT(*) FROM sketches GROUP BY status;

-- Phase 4 Check: System integrity
-- SELECT 
--   (SELECT COUNT(*) FROM payment_history WHERE payment_status = 'completed') as payments,
--   (SELECT SUM(credits_purchased) FROM payment_history WHERE payment_status = 'completed') as credits_sold,
--   (SELECT SUM(credits) FROM profiles) as credits_remaining;