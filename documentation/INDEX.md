# PixieSketch Documentation Index

## 🚀 Getting Started
- [README](../README.md) - Project overview and quick start
- [Claude.md](../Claude.md) - AI assistant instructions and project context
- [DEPLOYMENT_CHECKLIST](DEPLOYMENT_CHECKLIST.md) - Complete deployment checklist
- [FINAL-SETUP-CHECKLIST](FINAL-SETUP-CHECKLIST.md) - Final setup verification

## 🔧 Setup Guides

### Core Setup
- [EDGE-FUNCTIONS-DEPLOYMENT](EDGE-FUNCTIONS-DEPLOYMENT.md) - **URGENT: Deploy Edge Functions**
- [ADMIN-PANEL-SETUP](ADMIN-PANEL-SETUP.md) - Admin dashboard configuration
- [GOOGLE_AUTH_SETUP](GOOGLE_AUTH_SETUP.md) - Google OAuth configuration

### Payment Setup
- [STRIPE-SETUP](STRIPE-SETUP.md) - Stripe payment integration
- [ADVANCED-PAYMENT-SETUP](ADVANCED-PAYMENT-SETUP.md) - Advanced payment features
- [PAYMENT-FLOW-TEST](PAYMENT-FLOW-TEST.md) - Payment testing guide

### Email Setup
- [RESEND-SETUP](RESEND-SETUP.md) - Email service configuration

## 🐛 Troubleshooting
- [EDGE-FUNCTION-TROUBLESHOOTING](EDGE-FUNCTION-TROUBLESHOOTING.md) - Edge Function issues
- [ADMIN-TROUBLESHOOTING](ADMIN-TROUBLESHOOTING.md) - Admin panel issues
- [CREDIT-SYSTEM-FIXES](CREDIT-SYSTEM-FIXES.md) - Credit system solutions
- [URGENT-CREDIT-SYNC-FIX](URGENT-CREDIT-SYNC-FIX.md) - Critical credit sync fixes
- [SECURITY-FIXES](SECURITY-FIXES.md) - Security improvements

## 📋 Testing
- [TESTING-QUICK-START](TESTING-QUICK-START.md) - Quick testing guide
- [FULL-TESTING-SUITE](FULL-TESTING-SUITE.md) - Comprehensive testing
- [credit-system-test-plan](credit-system-test-plan.md) - Credit system testing

## 🚀 Deployment
- [VERCEL_DEPLOYMENT_GUIDE](VERCEL_DEPLOYMENT_GUIDE.md) - Vercel deployment
- [deploymentoptions](deploymentoptions.md) - All deployment options
- [DEPLOY-ADMIN-FUNCTION](DEPLOY-ADMIN-FUNCTION.md) - Admin function deployment

## 📊 Project Planning
- [projectplan](projectplan.md) - Original project plan

---

## Current Status & Priority Actions

### 🔴 Critical Issues
1. **Edge Functions Not Deployed** - Follow [EDGE-FUNCTIONS-DEPLOYMENT](EDGE-FUNCTIONS-DEPLOYMENT.md)
   - This is causing "Failed to send a request to the Edge Function" errors
   - All 7 Edge Functions need deployment

### 🟡 Important Setup
2. **API Keys Required**:
   - OpenAI API Key (for AI transformations)
   - Stripe Secret Key (for payments)
   - Resend API Key (for emails)

### 🟢 Completed
- ✅ Budget SQL schema applied
- ✅ Admin dashboard code ready
- ✅ All Edge Functions code complete

## Quick Commands

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Deploy all Edge Functions
supabase link --project-ref uihnpebacpcndtkdizxd
supabase functions deploy

# Start local development
npm run dev
```

## Support

For issues not covered in documentation:
1. Check error logs in Supabase Dashboard
2. Review browser console for detailed errors
3. Verify all environment variables are set
4. Ensure all SQL schemas are applied