# 🔐 Admin Panel Setup Guide - PixieSketch

## Overview
Complete admin panel for super user `diogo@diogoppedro.com` with secure access controls and comprehensive management features.

## 🚀 Setup Instructions

### Step 1: Deploy Database Policies
Run this in your Supabase SQL Editor:
```sql
-- Copy and paste the entire content of supabase/admin-policies.sql
```

### Step 2: Deploy Admin Edge Function
```bash
# Deploy the admin-operations function
supabase functions deploy admin-operations
```

### Step 3: Verify Admin Access
1. **Sign in** as `diogo@diogoppedro.com`
2. **Navigate** to `/admin` or click the "Admin" button in header
3. **Verify** access granted

## 🎛️ Admin Panel Features

### 📊 Dashboard Overview
- **Total Users**: Count of all registered users
- **Total Credits**: Sum of all user credits in system
- **Total Revenue**: Sum of all successful payments
- **Successful Payments**: Count of completed transactions

### 👥 User Management
- **View All Users**: Complete list with email, credits, creation date
- **Search Users**: Filter by email address
- **Reset Password**: Send password reset emails
- **Manage Credits**: Add/remove credits from any user
- **Real-time Updates**: Live data refresh

### 💳 Payment History
- **View All Transactions**: Complete payment history
- **Filter by Email**: Search specific user payments
- **Status Tracking**: See completed/failed/pending payments
- **Revenue Analysis**: Track payment amounts and packages

### 🔧 Admin Operations
- **Bulk Credit Reset**: Reset all users to 0 credits
- **Individual Credit Management**: Add/remove specific amounts
- **Password Reset**: Force password resets for users
- **Audit Logging**: Track all admin actions

## 🔒 Security Features

### Authentication
- **Super User Only**: Only `diogo@diogoppedro.com` has access
- **Route Protection**: All admin routes secured
- **Database Policies**: RLS policies enforce admin-only access
- **Edge Function Security**: Server-side admin verification

### Audit Trail
- **Action Logging**: All admin actions logged to database
- **User Tracking**: Track which users are affected
- **Timestamp Records**: When actions occurred
- **Detail Storage**: What changes were made

### Data Protection
- **Read-Only by Default**: Admin can view all data
- **Explicit Permissions**: Only specific operations allowed
- **Service Role**: Backend operations use service role key
- **Error Handling**: Graceful error responses

## 🛠️ Available Admin Functions

### User Credit Management
```typescript
// Add 10 credits to user
handleGiveCredits(userId, 10)

// Remove 5 credits from user  
handleGiveCredits(userId, -5)

// Reset all users to 0 credits
handleResetAllCredits()
```

### User Account Management
```typescript
// Send password reset email
handleResetPassword(userEmail)
```

### Data Operations
```typescript
// Refresh all admin data
fetchData()

// Search users by email
setSearchTerm("user@example.com")
```

## 📱 Admin Panel Navigation

### Access Points
1. **Direct URL**: `/admin`
2. **Header Button**: "Admin" button (only visible to super user)
3. **Home Navigation**: Click "Back to App" to return

### Interface Tabs
- **Users Tab**: User management and credit operations
- **Payments Tab**: Transaction history and revenue tracking

## 🗃️ Database Schema

### Admin-Specific Tables
```sql
-- Audit log for admin actions
admin_audit_log (
  id UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID,
  target_email TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Admin Functions
```sql
-- Check if current user is admin
is_admin() -> boolean

-- Reset all user credits (admin only)
admin_reset_all_credits() -> integer

-- Give credits to specific user (admin only)
admin_give_credits(user_id, amount) -> boolean

-- Get comprehensive admin stats (admin only)
admin_get_stats() -> json

-- Log admin actions for audit trail
log_admin_action(action, target_user, target_email, details) -> void
```

## 🔍 Monitoring & Analytics

### Real-time Stats
- User count and growth
- Credit distribution
- Revenue tracking
- Payment success rates

### Audit Capabilities
- Action history tracking
- User impact analysis
- Time-based reporting
- Change detection

## ⚠️ Important Security Notes

1. **Super User Email**: Hardcoded as `diogo@diogoppedro.com`
2. **No Email Changes**: Admin email cannot be changed via UI
3. **Service Role Protection**: Backend uses service role for admin operations
4. **Audit Logging**: All actions are logged for accountability
5. **Error Handling**: Graceful failures with user-friendly messages

## 🧪 Testing Admin Panel

### Test Scenarios
1. **Access Control**: Try accessing `/admin` with non-admin user
2. **Credit Management**: Add/remove credits from test users
3. **Password Reset**: Send reset emails to test accounts
4. **Bulk Operations**: Reset all credits and verify
5. **Audit Trail**: Check admin actions are logged

### Verification Steps
1. **Database Check**: Verify admin policies active
2. **Function Test**: Test admin-operations Edge Function
3. **UI Navigation**: Ensure all buttons/links work
4. **Error Handling**: Test invalid operations
5. **Security**: Confirm non-admin access denied

## 🚀 Post-Setup Checklist

- [ ] Admin policies deployed to Supabase
- [ ] Admin Edge Function deployed
- [ ] Admin panel accessible at `/admin`
- [ ] Super user can view all data
- [ ] Credit management functions work
- [ ] Password reset emails send
- [ ] Audit logging operational
- [ ] Non-admin users blocked from access
- [ ] All security policies active

## 📞 Troubleshooting

### Common Issues
1. **Access Denied**: Check super user email matches exactly
2. **Function Errors**: Verify Edge Function deployment
3. **Database Errors**: Confirm admin policies applied
4. **UI Issues**: Check React route and component imports
5. **Permission Errors**: Verify RLS policies and functions

### Debug Commands
```sql
-- Check if admin function exists
SELECT * FROM information_schema.routines WHERE routine_name = 'is_admin';

-- Test admin access
SELECT is_admin();

-- View admin audit log
SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 10;
```

---

**🎉 Admin Panel Ready!** 
Navigate to `/admin` as `diogo@diogoppedro.com` to start managing your PixieSketch platform.