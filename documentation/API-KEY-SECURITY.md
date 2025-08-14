# API Key Security Guide for PixieSketch

## Overview

This document outlines the secure management and deployment of API keys for PixieSketch in production.

## API Key Types and Security Levels

### 1. Public Keys (Safe to expose in frontend)
These keys are designed to be used in client-side code:

- **VITE_SUPABASE_URL** - Public Supabase project URL
- **VITE_SUPABASE_ANON_KEY** - Public anonymous key with RLS protection
- **VITE_STRIPE_PUBLISHABLE_KEY** - Public Stripe key for checkout

### 2. Secret Keys (Must be secured in Edge Functions)
These keys must NEVER be exposed in frontend code:

- **OPENAI_API_KEY** - For AI image generation
- **STRIPE_SECRET_KEY** - For payment processing
- **STRIPE_WEBHOOK_SECRET** - For webhook verification
- **EMAIL_API_KEY** - For sending receipts (Resend/SendGrid)
- **SUPABASE_SERVICE_ROLE_KEY** - For admin database operations

## Production API Key Setup

### Step 1: Generate Production Keys

1. **OpenAI API Key**
   ```
   https://platform.openai.com/api-keys
   - Create new secret key
   - Set usage limits
   - Enable only required models (GPT-4 Vision, DALL-E 3)
   ```

2. **Stripe Production Keys**
   ```
   https://dashboard.stripe.com/apikeys
   - Switch to "Live mode"
   - Copy secret key (sk_live_...)
   - Copy publishable key (pk_live_...)
   ```

3. **Stripe Webhook Secret**
   ```
   https://dashboard.stripe.com/webhooks
   - Create endpoint: https://[your-project].supabase.co/functions/v1/stripe-webhook
   - Copy signing secret (whsec_...)
   ```

4. **Resend API Key**
   ```
   https://resend.com/api-keys
   - Create production key
   - Limit to sending domain
   ```

### Step 2: Store Keys Securely

#### Supabase Edge Functions (Backend)
```bash
# Store in Supabase Vault (encrypted)
npx supabase secrets set OPENAI_API_KEY="sk-..."
npx supabase secrets set STRIPE_SECRET_KEY="sk_live_..."
npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
npx supabase secrets set EMAIL_API_KEY="re_..."
```

#### Vercel Frontend (Public keys only)
```bash
# Add via Vercel Dashboard or CLI
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
```

## Security Best Practices

### 1. Key Rotation Policy
- Rotate all API keys every 90 days
- Immediately rotate if compromise suspected
- Keep previous key active for 24 hours during rotation

### 2. Access Control
- Limit Supabase project access to essential team members
- Use Vercel team features for frontend deployment access
- Enable 2FA for all accounts with key access

### 3. Key Restrictions

#### OpenAI
- Set monthly spending limits
- Restrict to required models only
- Monitor usage dashboard daily

#### Stripe
- Enable webhook signature verification
- Set up fraud detection rules
- Configure payment method restrictions

#### Email (Resend)
- Verify sending domain
- Set rate limits
- Configure SPF/DKIM records

### 4. Environment Separation
```
Development:
- Use test keys (pk_test_, sk_test_)
- Separate Supabase project recommended
- Different email domain for testing

Production:
- Live keys only (pk_live_, sk_live_)
- Production Supabase project
- Verified email domain
```

## Monitoring and Alerts

### 1. Set Up Monitoring
- **OpenAI**: Monitor API usage and costs
- **Stripe**: Set up webhook alerts for failures
- **Supabase**: Monitor Edge Function invocations
- **Email**: Track delivery rates

### 2. Alert Thresholds
```javascript
// Example monitoring setup
- OpenAI usage > $100/day
- Stripe webhook failure rate > 5%
- Edge Function error rate > 1%
- Email bounce rate > 5%
```

## Emergency Procedures

### If a Key is Compromised:

1. **Immediate Actions**
   ```bash
   # 1. Revoke compromised key immediately
   # 2. Generate new key
   # 3. Update in Supabase/Vercel
   npx supabase secrets set [KEY_NAME]="new-key-value"
   ```

2. **Assessment**
   - Check logs for unauthorized usage
   - Review billing for unexpected charges
   - Audit recent API calls

3. **Prevention**
   - Review how compromise occurred
   - Update access controls
   - Implement additional monitoring

## Local Development Security

### Never commit keys to git:
```bash
# .env.local (gitignored)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# For Edge Functions testing
supabase secrets set --env-file .env.local
```

### Use separate test keys:
- Create test-only API keys when possible
- Use Stripe test mode for development
- Use OpenAI with spending limits

## Production Deployment Checklist

- [ ] All production API keys generated
- [ ] Keys stored in Supabase Vault
- [ ] Frontend env vars set in Vercel
- [ ] Webhook endpoints configured
- [ ] Monitoring alerts configured
- [ ] Team access controls reviewed
- [ ] Key rotation schedule documented
- [ ] Emergency contacts listed

## Key Storage Reference

| Key | Where Stored | Type | Rotation |
|-----|--------------|------|----------|
| OPENAI_API_KEY | Supabase Vault | Secret | 90 days |
| STRIPE_SECRET_KEY | Supabase Vault | Secret | 90 days |
| STRIPE_WEBHOOK_SECRET | Supabase Vault | Secret | Never* |
| EMAIL_API_KEY | Supabase Vault | Secret | 90 days |
| VITE_SUPABASE_URL | Vercel Env | Public | Never |
| VITE_SUPABASE_ANON_KEY | Vercel Env | Public | Never |
| VITE_STRIPE_PUBLISHABLE_KEY | Vercel Env | Public | Never |

*Webhook secrets should only be rotated if compromised

## Support Contacts

- **Stripe Support**: support@stripe.com
- **OpenAI Support**: support@openai.com
- **Supabase Support**: support@supabase.com
- **Internal Security**: [Your security contact]

---

Last Updated: August 2025
Next Review: November 2025