# Vercel Deployment Guide for PixieSketch

## Quick Start Deployment Steps

### 1. Deploy to Vercel

You have two options:

#### Option A: Deploy via Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm i -g vercel

# In your project directory
vercel

# Follow the prompts:
# - Link to existing project? No (create new)
# - What's your project name? pixiesketch
# - In which directory is your code? ./ (current directory)
# - Override settings? No
```

#### Option B: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your Git repository: `BuildTechDeployAiAgency/pixieSketchAi`
4. Configure project settings (auto-detected for Vite)
5. Add environment variables (see below)
6. Click "Deploy"

### 2. Environment Variables

Add these environment variables in Vercel dashboard (Settings → Environment Variables):

```bash
# Required for all environments
VITE_SUPABASE_URL=https://uihnpebacpcndtkdizxd.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key

# For Preview/Development
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
```

### 3. Post-Deployment Configuration

#### Update Supabase Settings

1. **Add Production URL to Supabase Auth**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add to Redirect URLs:
     - `https://pixiesketch.vercel.app`
     - `https://your-custom-domain.com` (if using custom domain)

2. **Update CORS Settings**
   - Go to Supabase Dashboard → Settings → API
   - Add your Vercel URLs to allowed origins

#### Update Stripe Configuration

1. **Update Webhook Endpoints**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`

2. **Update Success/Cancel URLs**
   - These are already dynamically set in your code using `window.location.origin`
   - No changes needed!

### 4. Custom Domain Setup (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions:
   - For apex domain: Add A record pointing to `76.76.21.21`
   - For subdomain: Add CNAME record pointing to `cname.vercel-dns.com`
4. SSL certificate will auto-provision

### 5. Verify Deployment

After deployment, test these critical paths:

- [ ] Homepage loads correctly
- [ ] User registration/login works
- [ ] Google OAuth authentication works
- [ ] File upload functionality works
- [ ] AI transformation processes correctly
- [ ] Payment flow completes successfully
- [ ] Admin panel accessible (for admin@example.com)
- [ ] Real-time credit updates work

### 6. Production Checklist

Before going live:

- [ ] Set production Stripe keys
- [ ] Update admin email in code (currently `diogo@diogoppedro.com`)
- [ ] Configure custom domain
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Test all payment flows with real cards
- [ ] Verify email sending works
- [ ] Check all environment variables are set correctly

## Deployment Commands Reference

### Initial Deployment
```bash
vercel --prod
```

### Deploy from Specific Branch
```bash
vercel --prod --scope=your-team-name
```

### Link Existing Project
```bash
vercel link
```

### Pull Environment Variables Locally
```bash
vercel env pull .env.local
```

### View Deployment Logs
```bash
vercel logs your-deployment-url
```

## Troubleshooting

### Common Issues and Solutions

1. **Build Fails**
   - Check Node version (should be 18.x)
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

2. **Environment Variables Not Working**
   - Ensure variables start with `VITE_`
   - Redeploy after adding new variables
   - Check they're set for correct environment (Production/Preview)

3. **404 Errors on Routes**
   - Verify vercel.json has SPA rewrite rules
   - Check routes work locally first

4. **CORS Errors**
   - Add Vercel domain to Supabase allowed origins
   - Check Supabase URL is correct in env vars

5. **Payment Issues**
   - Verify Stripe webhook secret is set in Supabase
   - Check webhook endpoint URL is correct
   - Ensure Stripe keys match environment (test/live)

## Monitoring & Analytics

### Enable Vercel Analytics (Optional)
```bash
vercel analytics enable
```

### View Real-time Logs
```bash
vercel logs --follow
```

### Performance Monitoring
- Check Web Vitals in Vercel Dashboard
- Monitor function execution times
- Track error rates

## Continuous Deployment

Your project is now set up for automatic deployments:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests get preview URLs
- **Rollback**: Use Vercel dashboard to instant rollback

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/guides/vite)
- [Troubleshooting Guide](https://vercel.com/guides/troubleshooting)
- [Support](https://vercel.com/support)

---

🎉 Your PixieSketch app is now ready for production on Vercel!