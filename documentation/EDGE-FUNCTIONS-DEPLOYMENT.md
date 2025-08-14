# Edge Functions Deployment Guide

## Current Issue
The error "Failed to send a request to the Edge Function" occurs because the Edge Functions are not deployed to your Supabase project.

## Edge Functions in Your Project

You have 7 Edge Functions that need to be deployed:

1. **admin-operations** - Admin dashboard operations (credits, password reset, budget stats)
2. **analyze-drawing** - AI analysis of uploaded drawings
3. **process-sketch** - AI transformation of sketches
4. **create-payment** - Stripe payment session creation
5. **send-email** - Email notifications via Resend
6. **stripe-webhook** - Stripe webhook handler
7. **verify-payment** - Payment verification

## Deployment Steps

### 1. Install Supabase CLI

```bash
# macOS (using Homebrew)
brew install supabase/tap/supabase

# Alternative: Using npm
npm install -g supabase

# Alternative: Using npx (no installation)
npx supabase <command>
```

### 2. Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### 3. Link Your Project

```bash
# Navigate to your project directory
cd /Users/diogoppedro/PixieSketch/magic-sketch-dreams-main

# Link to your Supabase project
supabase link --project-ref uihnpebacpcndtkdizxd
```

### 4. Set Environment Variables

Create a `.env` file in your `supabase/functions` directory:

```bash
# Required for Edge Functions
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
RESEND_API_KEY=your-resend-api-key
```

### 5. Deploy All Edge Functions

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually
supabase functions deploy admin-operations --no-verify-jwt
supabase functions deploy analyze-drawing --no-verify-jwt
supabase functions deploy process-sketch --no-verify-jwt
supabase functions deploy create-payment --no-verify-jwt
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy verify-payment --no-verify-jwt
```

### 6. Set Secrets in Supabase Dashboard

After deployment, set your API keys as secrets:

```bash
# Set secrets via CLI
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set STRIPE_SECRET_KEY=your-key
supabase secrets set STRIPE_WEBHOOK_SECRET=your-key
supabase secrets set RESEND_API_KEY=your-key
```

Or via Dashboard:
1. Go to https://supabase.com/dashboard/project/uihnpebacpcndtkdizxd
2. Navigate to Settings → Edge Functions
3. Add environment variables

## Verification

### 1. Check Deployed Functions

```bash
supabase functions list
```

### 2. Test Admin Operations

In browser console at http://localhost:8080/admin:

```javascript
// Test health check
const { data, error } = await supabase.functions.invoke('admin-operations', {
  body: { operation: 'health' }
});
console.log('Health check:', data, error);
```

### 3. Check Function Logs

```bash
# View logs for a specific function
supabase functions logs admin-operations --tail

# View logs for all functions
supabase functions logs --tail
```

## Alternative: Deploy via GitHub Actions

If you prefer automated deployment:

1. Fork the repository to GitHub
2. Add these secrets to your GitHub repository:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_ID`
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`

3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Supabase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
          
      - run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Troubleshooting

### Issue: "supabase: command not found"
- Ensure Supabase CLI is installed correctly
- Try using `npx supabase` instead

### Issue: "Project not linked"
- Run `supabase link --project-ref uihnpebacpcndtkdizxd`

### Issue: "Authentication failed"
- Run `supabase login` again
- Check your Supabase account has access to the project

### Issue: "Function deployment failed"
- Check function syntax: `deno check supabase/functions/[function-name]/index.ts`
- Ensure all required environment variables are set
- Check Supabase service status: https://status.supabase.com

## Required API Keys

To fully deploy and use all Edge Functions, you need:

1. **OpenAI API Key** - For AI transformations
   - Get from: https://platform.openai.com/api-keys

2. **Stripe Secret Key** - For payment processing
   - Get from: https://dashboard.stripe.com/apikeys

3. **Stripe Webhook Secret** - For webhook verification
   - Get from: Stripe Dashboard → Webhooks

4. **Resend API Key** - For email notifications
   - Get from: https://resend.com/api-keys

## Post-Deployment Checklist

- [ ] All 7 Edge Functions deployed
- [ ] Environment variables/secrets set
- [ ] Admin operations working (test Credits button)
- [ ] AI transformations working (test sketch upload)
- [ ] Payment flow working (test checkout)
- [ ] Email notifications working (if configured)

## Emergency Fallback

If Edge Functions fail to deploy, you can temporarily use Supabase Database Functions for some operations:

1. Admin operations can use direct database queries (less secure)
2. Payment processing must use Edge Functions (no fallback)
3. AI transformations must use Edge Functions (no fallback)

Always deploy Edge Functions for production use!