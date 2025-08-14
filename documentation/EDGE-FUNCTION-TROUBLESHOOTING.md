# Edge Function Troubleshooting Guide

## Error: "Failed to send a request to the Edge Function"

This error typically means the Edge Function is either not deployed, misconfigured, or experiencing runtime errors.

## Quick Fix Steps

### 1. Deploy the Updated Edge Function

```bash
# Make sure you're in the project root directory
cd /Users/diogoppedro/PixieSketch/magic-sketch-dreams-main

# Deploy the admin-operations function
supabase functions deploy admin-operations --no-verify-jwt
```

### 2. Verify Deployment

```bash
# Check if function is deployed
./verify-edge-functions.sh

# Or manually check
supabase functions list
```

### 3. Test the Health Check

Open your browser console on the admin page and run:

```javascript
// Copy the contents of test-admin-health.js and paste into console
// Or run this directly:
supabase.functions.invoke('admin-operations', {
  body: { operation: 'health' }
}).then(console.log).catch(console.error);
```

### 4. Check Function Logs

```bash
# View recent logs
supabase functions logs admin-operations

# Stream live logs
supabase functions logs admin-operations --tail
```

## Common Issues and Solutions

### Issue 1: Function Not Deployed
**Symptoms**: Function doesn't appear in `supabase functions list`

**Fix**:
```bash
supabase functions deploy admin-operations --no-verify-jwt
```

### Issue 2: Missing Environment Variables
**Symptoms**: Logs show "Missing required environment variables"

**Fix**: Check Supabase Dashboard → Settings → Edge Functions → Environment Variables
Required variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

### Issue 3: CORS Errors
**Symptoms**: Browser console shows CORS-related errors

**Fix**: The function has been updated with proper CORS headers. Redeploy if needed.

### Issue 4: Authentication Issues
**Symptoms**: "Access denied" errors even when logged in as admin

**Fix**: 
1. Ensure you're logged in as `diogo@diogoppedro.com`
2. Check that admin policies are deployed (run `admin-policies.sql`)
3. Test with: `supabase.rpc('is_admin').then(console.log)`

## What We Fixed

1. **Updated Dependencies**: Aligned Deno versions with other working functions
2. **Added Health Check**: New endpoint to test basic connectivity
3. **Better Error Handling**: More descriptive error messages
4. **Environment Variable Validation**: Early checks for required variables
5. **Improved Logging**: Better visibility into function execution

## Manual Testing Steps

1. **Basic Health Check**:
   ```javascript
   await supabase.functions.invoke('admin-operations', {
     body: { operation: 'health' }
   });
   ```

2. **Test Credit Update** (be careful with this):
   ```javascript
   await supabase.functions.invoke('admin-operations', {
     body: { 
       operation: 'update_credits',
       userId: 'some-user-id',
       creditChange: 1
     }
   });
   ```

3. **Test Password Reset**:
   ```javascript
   await supabase.functions.invoke('admin-operations', {
     body: { 
       operation: 'reset_password',
       email: 'test@example.com'
     }
   });
   ```

## If Still Not Working

1. **Check Supabase Status**: https://status.supabase.com
2. **Verify Project ID**: Ensure `uihnpebacpcndtkdizxd` is correct
3. **Check Browser Network Tab**: Look for detailed error responses
4. **Review Function Code**: Ensure no syntax errors in the deployed version

## Emergency Fallback

If Edge Functions continue to fail, you can temporarily use direct database operations:

```javascript
// Direct credit update (use with caution)
const { error } = await supabase
  .from('profiles')
  .update({ credits: newCredits })
  .eq('id', userId);
```

Remember to switch back to Edge Functions once they're working properly for security reasons.