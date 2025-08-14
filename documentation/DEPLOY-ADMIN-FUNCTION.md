# Deploy Admin Operations Edge Function

## Quick Deployment Steps

### 1. Install Supabase CLI (if not already installed)

```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
# Navigate to project directory
cd /Users/diogoppedro/PixieSketch/magic-sketch-dreams-main

# Link to your project
supabase link --project-ref uihnpebacpcndtkdizxd
```

### 4. Deploy the Admin Operations Function

```bash
# Deploy with no JWT verification (required for admin operations)
supabase functions deploy admin-operations --no-verify-jwt
```

### 5. Verify Deployment

```bash
# List all deployed functions
supabase functions list

# Check function logs
supabase functions logs admin-operations --tail
```

## Testing the Deployment

### 1. Test Health Check in Browser Console

Navigate to your admin dashboard and run in console:

```javascript
const { supabase } = window;
const { data, error } = await supabase.functions.invoke('admin-operations', {
  body: { operation: 'health' }
});
console.log('Health check:', data, error);
```

### 2. Expected Response

```json
{
  "success": true,
  "message": "Admin operations function is healthy",
  "timestamp": "2025-08-14T..."
}
```

## Environment Variables

The Edge Function requires these environment variables (automatically set by Supabase):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting

### If deployment fails:

1. **Check Supabase CLI version**:
   ```bash
   supabase --version
   ```
   Update if needed: `brew upgrade supabase`

2. **Verify you're logged in**:
   ```bash
   supabase projects list
   ```

3. **Check function syntax**:
   ```bash
   deno check supabase/functions/admin-operations/index.ts
   ```

### If function calls fail after deployment:

1. **Check CORS origin**: Make sure you're accessing from `http://localhost:8080` or your production domain

2. **Verify admin email**: Ensure you're logged in as `diogo@diogoppedro.com`

3. **Check function logs**:
   ```bash
   supabase functions logs admin-operations --tail
   ```

## What This Fixes

- ✅ Manual credit management (add/remove credits for users)
- ✅ Password reset functionality
- ✅ Admin statistics retrieval
- ✅ Budget management operations

## Next Steps

After deploying the admin function:

1. **Apply Budget SQL Schema** (if not done):
   - Go to Supabase SQL Editor
   - Run the contents of `supabase/credit-budget-system.sql`

2. **Test Credit Management**:
   - Click "Credits" button for any user
   - Try adding/removing credits

3. **Verify All Features**:
   - Password reset
   - Credit updates
   - Budget statistics (after SQL schema)

## Production Deployment

For production, ensure:
1. All Edge Functions are deployed
2. Environment variables are set correctly
3. CORS origins include your production domain
4. Admin email is correctly configured