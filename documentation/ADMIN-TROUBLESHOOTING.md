# 🚨 Admin Panel Troubleshooting Guide

## Current Issue: "Failed to load admin data"

### **Admin Credentials Confirmed:**
- **Super User Email**: `diogo@diogoppedro.com`
- **Admin Route**: `/admin`
- **Access Method**: Header "Admin" button (visible only when logged in as super user)

## 🔍 Immediate Diagnosis Steps

### Step 1: Check Current Authentication
Open browser console and run:
```javascript
// Copy/paste admin-debug.js content into console
// Then run:
adminFix.diagnose()
```

### Step 2: Verify You're Logged In as Admin
1. **Check email in header**: Should show `diogo@diogoppedro.com`
2. **Look for Admin button**: Only visible to super user
3. **Current URL**: Should be `localhost:8080/admin`

### Step 3: Deploy Admin Policies (If Not Done)
**In Supabase Dashboard → SQL Editor:**
```sql
-- Run the entire admin-policies.sql file
-- This creates the is_admin() function and all policies
```

## 🔧 Most Likely Issues & Fixes

### Issue 1: Not Logged In as Admin User ⚠️
**Symptoms**: 
- No "Admin" button in header
- "Access Denied" message
- Redirected away from `/admin`

**Fix**:
1. Sign out current user
2. Sign in as `diogo@diogoppedro.com`
3. Navigate to `/admin`

### Issue 2: Admin Policies Not Deployed 🚨
**Symptoms**:
- "Failed to load admin data" error
- Console errors about `is_admin` function
- Permission denied errors

**Fix**:
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy entire `admin-policies.sql` content
4. Execute the SQL
5. Verify functions created

### Issue 3: Wrong Admin Email 📧
**Current Config**: `diogo@diogoppedro.com`
**If you need to change this**:
```sql
-- Update admin email in Supabase SQL Editor
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT email FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'your-correct-email@domain.com'  -- Change this
  ) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🧪 Testing Steps

### Test 1: Authentication Check
```javascript
// In browser console:
supabase.auth.getUser().then(({data}) => {
  console.log('Current user:', data.user?.email);
  console.log('Is admin email:', data.user?.email === 'diogo@diogoppedro.com');
});
```

### Test 2: Admin Function Test
```javascript
// In browser console:
supabase.rpc('is_admin').then(({data, error}) => {
  console.log('Admin function result:', data);
  console.log('Error:', error);
});
```

### Test 3: Profile Access Test
```javascript
// In browser console:
supabase.from('profiles').select('email, credits').limit(1).then(({data, error}) => {
  console.log('Profile access:', data ? 'SUCCESS' : 'FAILED');
  console.log('Error:', error?.message);
});
```

## 📋 Quick Fix Checklist

- [ ] **Logged in as correct admin user** (`diogo@diogoppedro.com`)
- [ ] **Admin policies deployed** to Supabase
- [ ] **Admin button visible** in header
- [ ] **Browser console shows no errors** when visiting `/admin`
- [ ] **Admin functions working** (test with `adminFix.testFunctions()`)

## 🔍 Advanced Debugging

### Check Admin Function Exists
```sql
-- Run in Supabase SQL Editor
SELECT * FROM information_schema.routines 
WHERE routine_name = 'is_admin';
```

### Check Admin Table Exists
```sql
-- Run in Supabase SQL Editor
SELECT * FROM information_schema.tables 
WHERE table_name = 'admin_audit_log';
```

### Test Admin Function Directly
```sql
-- Run in Supabase SQL Editor (while logged in as admin)
SELECT is_admin();
```

## 🚀 Expected Behavior When Working

1. **Sign in as `diogo@diogoppedro.com`**
2. **See "Admin" button** in header (purple outline)
3. **Click Admin button** → Navigate to `/admin`
4. **See admin dashboard** with:
   - User count, credits, revenue stats
   - User management table
   - Payment history table
   - Search and filter options

## 📞 If Still Not Working

1. **Clear browser cache** and reload
2. **Check Supabase logs** for errors
3. **Verify network requests** in browser dev tools
4. **Run the debug script** and share results

---

**Most likely fix**: Deploy the admin policies to Supabase if you haven't already! 🎯