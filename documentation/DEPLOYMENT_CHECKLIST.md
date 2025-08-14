# 🚀 PixieSketch Security Update Deployment Checklist

## Pre-Deployment Steps

### ✅ 1. Verify Environment Variables
Make sure these are set in Vercel:
```
VITE_SUPABASE_URL=https://uihnpebacpcndtkdizxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ✅ 2. Review CORS Configuration
Current allowed origins in Edge Functions:
- `http://localhost:8080` (development)
- `https://pixie-sketch-ai.vercel.app` (production)
- `https://pixiesketch.com` (if used)

## Deployment Steps

### ✅ 3. Deploy Edge Functions
Run the deployment script:
```bash
./deploy-functions.sh
```

Or deploy manually:
```bash
supabase functions deploy analyze-drawing --no-verify-jwt
supabase functions deploy process-sketch --no-verify-jwt  
supabase functions deploy create-payment --no-verify-jwt
supabase functions deploy admin-operations --no-verify-jwt
```

### ✅ 4. Deploy Frontend Changes
Vercel should auto-deploy from GitHub, or manually trigger:
- Visit Vercel dashboard
- Trigger new deployment
- Wait for completion

## Post-Deployment Testing

### ✅ 5. CORS Testing
1. **Automated Testing**:
   - Visit: https://pixie-sketch-ai.vercel.app/test-cors.html
   - Click "Run All CORS Tests"
   - Verify all functions return ✅ status

2. **Manual Browser Testing**:
   ```javascript
   // Run in browser console on pixie-sketch-ai.vercel.app
   fetch('https://uihnpebacpcndtkdizxd.supabase.co/functions/v1/analyze-drawing', {
     method: 'OPTIONS'
   }).then(r => console.log('CORS Origin:', r.headers.get('Access-Control-Allow-Origin')))
   ```

### ✅ 6. Application Functionality Testing
Test each major feature:

**Drawing Upload & Transformation:**
- [ ] Upload a drawing successfully
- [ ] Select AI preset (cartoon/pixar/realistic)
- [ ] Verify transformation completes
- [ ] Check no CORS errors in console

**Authentication:**
- [ ] Email/password login works
- [ ] Google OAuth works
- [ ] No CORS errors during auth

**Payment System:**
- [ ] Credit purchase flow works
- [ ] Stripe checkout opens correctly
- [ ] Payment completion updates credits
- [ ] No CORS errors during payment

**Admin Panel** (if admin):
- [ ] Admin dashboard loads
- [ ] User management works
- [ ] Credit adjustments work
- [ ] No CORS errors in admin operations

### ✅ 7. Security Verification
Check that security headers are working:

1. **Content Security Policy**:
   - Open browser dev tools → Network
   - Check response headers include CSP
   - Verify no CSP violations in console

2. **CORS Restrictions**:
   - Test from unauthorized domain (should fail)
   - Verify only allowed origins work

3. **Environment Variables**:
   - Verify no hardcoded credentials in client code
   - Check Vercel environment variables are loaded

## Rollback Plan

If issues are detected:

### ✅ 8. Emergency Rollback
1. **Revert Edge Functions** (if needed):
   ```bash
   # Deploy previous version or hotfix
   supabase functions deploy <function-name>
   ```

2. **Revert Frontend** (if needed):
   - Revert Git commit
   - Push to trigger new Vercel deployment

## Success Criteria

Deployment is successful when:
- [ ] All CORS tests pass (4/4 functions)
- [ ] Core app functionality works (upload, transform, pay)
- [ ] No console errors on production site
- [ ] Security headers are present and working
- [ ] Performance remains acceptable

## Troubleshooting Guide

### Common Issues & Solutions

**CORS Errors:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Solution:** Check if your domain is in the `allowedOrigins` array in Edge Functions.

**Environment Variable Errors:**
```
Cannot read property 'VITE_SUPABASE_URL' of undefined
```
**Solution:** Verify environment variables are set in Vercel dashboard.

**Function Not Found:**
```
404 Not Found - Function does not exist
```
**Solution:** Redeploy the specific Edge Function with correct name.

**Authentication Issues:**
```
Invalid API key or authentication token
```
**Solution:** Check Supabase keys are correctly set in environment variables.

## Contact Information

If issues persist:
- Check GitHub repository for latest updates
- Review Vercel deployment logs
- Check Supabase Edge Function logs
- Verify all environment variables are correctly set

---
**Last Updated:** $(date)
**Version:** 1.0 (Security Hardening Update)