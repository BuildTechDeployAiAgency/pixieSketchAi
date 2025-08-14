# 🚀 Quick Start Testing Guide

## Step 1: Reset Credits (Required First!)

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run this SQL**:
```sql
UPDATE profiles 
SET credits = 0, 
    updated_at = NOW()
WHERE credits > 0;

SELECT email, credits, updated_at
FROM profiles 
ORDER BY updated_at DESC;
```
3. **Verify** all users show 0 credits

## Step 2: Load Test Tools

1. **Open** localhost:8081 in browser
2. **Open** Developer Console (F12)
3. **Copy/paste** this to load test runner:

```javascript
// Copy the entire content of automated-test-runner.js and paste here
```

## Step 3: Quick Testing Flow

### Phase 1: UI Validation
```javascript
quickTest.phase1()
```
**Expected**: All UI elements found, user authenticated

### Phase 2: Credit Purchases
```javascript
// Test $1.00 purchase
// 1. Click "Buy Credits" → $1.00 option → complete payment
// 2. Then run:
quickTest.phase2(1, '$1.00')

// Test $4.99 purchase  
// 1. Buy $4.99 package
// 2. Then run:
quickTest.phase2(11, '$4.99')

// Test $9.99 purchase
// 1. Buy $9.99 package  
// 2. Then run:
quickTest.phase2(36, '$9.99')
```

### Phase 3: Image Processing
```javascript
// Before uploading image
quickTest.phase3Pre()

// Upload image, select preset, start processing
// After processing completes:
quickTest.phase3Post(36) // Use your starting credit count
```

### Phase 4: Zero Credits Test
```javascript
// Process images until credits = 0
// Then try to process another image
quickTest.phase4()
```

### Phase 5: Final Report
```javascript
quickTest.report()
```

## Step 4: Database Validation

**In Supabase SQL Editor**, run key validation queries:

```sql
-- Check credit balances
SELECT email, credits FROM profiles ORDER BY credits DESC;

-- Check payment history
SELECT customer_email, amount/100.0 as dollars, credits_purchased, payment_status 
FROM payment_history ORDER BY created_at DESC;

-- Check for duplicates (should be empty)
SELECT stripe_session_id, COUNT(*) 
FROM payment_history 
GROUP BY stripe_session_id 
HAVING COUNT(*) > 1;
```

## 🎯 Success Criteria

- [ ] All users start with 0 credits
- [ ] $1.00 purchase = exactly 1 credit
- [ ] $4.99 purchase = exactly 10 credits  
- [ ] $9.99 purchase = exactly 25 credits
- [ ] Credits deduct only AFTER successful processing
- [ ] No double-crediting in payment_history
- [ ] Real-time credit updates work
- [ ] Insufficient credits handled properly

## 🚨 Test Cards (Stripe Test Mode)

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## ⚡ Quick Troubleshooting

**Credits not updating?**
- Check browser console for errors
- Verify real-time subscriptions working
- Refresh page to force reload

**Payment not working?**
- Confirm using Stripe test keys
- Check Stripe dashboard for webhook logs
- Verify test card details

**Processing failing?**
- Check if OpenAI API key configured
- Monitor Edge Function logs in Supabase
- Verify sufficient credits before processing

---

**Ready to test! Start with Step 1 (reset credits) then proceed through the phases.**