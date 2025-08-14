# 🚨 URGENT: Credit Sync Issue Detected

## Problem Identified
- **UI Display**: 489 credits for diogoppedro@gmail.com
- **Expected**: 0 credits (after reset)
- **Issue**: Frontend/Backend not in sync

## Immediate Diagnosis Required

### Step 1: Check Database State
Run this in Supabase SQL Editor:
```sql
-- Check actual credits in database
SELECT 
    email, 
    credits, 
    updated_at,
    created_at 
FROM profiles 
WHERE email = 'diogoppedro@gmail.com';

-- Check payment history for this user
SELECT 
    customer_email,
    amount/100.0 as dollars,
    credits_purchased,
    payment_status,
    created_at
FROM payment_history 
WHERE customer_email = 'diogoppedro@gmail.com'
ORDER BY created_at DESC;
```

### Step 2: Force Reset Specific User
```sql
-- Force reset diogoppedro@gmail.com to 0 credits
UPDATE profiles 
SET credits = 0, 
    updated_at = NOW()
WHERE email = 'diogoppedro@gmail.com';

-- Verify reset
SELECT email, credits, updated_at 
FROM profiles 
WHERE email = 'diogoppedro@gmail.com';
```

### Step 3: Clear Frontend Cache
In browser console:
```javascript
// Clear all local storage and session storage
localStorage.clear();
sessionStorage.clear();

// Force refresh profile data
if (window.location.reload) {
    window.location.reload(true);
}
```

## Potential Root Causes

### 1. **Database Reset Didn't Include This User**
- Maybe user was created after reset
- Reset query didn't match all users

### 2. **Frontend Caching Issue**
- React state not updating from database
- Local storage persisting old values
- Real-time subscription not working

### 3. **Real-time Subscription Problem**
- Supabase realtime not properly connected
- Profile hook not refreshing data

## Immediate Fixes to Apply

### Fix 1: Force Database Sync
```javascript
// In browser console, force profile refresh
const { createClient } = supabase;
const supabaseClient = createClient(
  // Your Supabase URL and anon key
);

// Force fetch fresh profile
async function forceRefreshProfile() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user) {
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('Fresh profile data:', profile);
  }
}

forceRefreshProfile();
```

### Fix 2: Hard Reset User Profile
```sql
-- Nuclear option: Delete and recreate profile
DELETE FROM profiles WHERE email = 'diogoppedro@gmail.com';

-- Profile will be recreated with 10 starting credits on next login
-- Then manually set to 0:
UPDATE profiles 
SET credits = 0 
WHERE email = 'diogoppedro@gmail.com';
```

### Fix 3: Debug Real-time Subscription
```javascript
// Check if real-time is working
const testChannel = supabase
  .channel('test-channel')
  .on('broadcast', { event: 'test' }, (payload) => {
    console.log('Real-time working:', payload);
  })
  .subscribe();

// Send test message
testChannel.send({
  type: 'broadcast',
  event: 'test',
  payload: { message: 'test' }
});
```

## Diagnosis Questions

1. **When did you last reset credits?** 
2. **Did the SQL reset query run successfully?**
3. **Are there any console errors in the browser?**
4. **Has diogoppedro@gmail.com made any recent purchases?**

## Quick Test Commands

```javascript
// Load test runner and check current state
// (paste automated-test-runner.js first)

// Check what frontend thinks credits are
quickTest.credits()

// Check authentication
quickTest.phase1()

// Start monitoring for changes
quickTest.startMonitor()
```