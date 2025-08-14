# Stripe Production Payment Setup

## Your Production Keys

### Public Key (Frontend - Safe to expose)
```
pk_live_51RXiVsJlCd2GnfwVV7iYJr9lQgE1CQB6M0N8l4cBm15MLqrbf83Bv4o5HU8qNCr3YPAKHM5crogCTpPTzXLirT4G00kNdiIILG
```

### Secret Key (Backend - Keep secure)
You need to get your secret key from Stripe Dashboard:
1. Go to https://dashboard.stripe.com/apikeys
2. Switch to "Live mode" (toggle in dashboard)
3. Copy your secret key (starts with `sk_live_`)

## Setup Steps

### 1. Set Frontend Production Key

#### For Vercel Deployment:
```bash
# Add via Vercel Dashboard or CLI
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
# When prompted, paste: pk_live_51RXiVsJlCd2GnfwVV7iYJr9lQgE1CQB6M0N8l4cBm15MLqrbf83Bv4o5HU8qNCr3YPAKHM5crogCTpPTzXLirT4G00kNdiIILG
```

#### For Local Testing with Production Keys:
```bash
# Use the .env.production file
npm run build -- --mode production
npm run preview
```

### 2. Set Backend Secret Key in Supabase

```bash
# Get your secret key from Stripe Dashboard first
npx supabase secrets set STRIPE_SECRET_KEY="sk_live_YOUR_SECRET_KEY_HERE"
```

### 3. Configure Stripe Webhook

1. **Create Webhook Endpoint in Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://uihnpebacpcndtkdizxd.supabase.co/functions/v1/stripe-webhook`
   - Select events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

2. **Get Webhook Signing Secret:**
   - After creating, click on the webhook
   - Reveal "Signing secret" (starts with `whsec_`)
   - Copy this secret

3. **Set Webhook Secret in Supabase:**
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
   ```

### 4. Configure Payment Packages

In your Stripe Dashboard:

1. **Create Products** (optional, if using Stripe Products):
   - Go to https://dashboard.stripe.com/products
   - Create products for your packages:
     - Basic: $1.00 (1 credit)
     - Popular: $4.99 (10 credits)
     - Best Value: $9.99 (25 credits)

2. **Set Payment Methods:**
   - Go to https://dashboard.stripe.com/settings/payment_methods
   - Enable desired payment methods:
     - Cards (enabled by default)
     - Google Pay
     - Apple Pay
     - etc.

### 5. Production Environment Variables Summary

#### Frontend (.env.production or Vercel):
```
VITE_SUPABASE_URL=https://uihnpebacpcndtkdizxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RXiVsJlCd2GnfwVV7iYJr9lQgE1CQB6M0N8l4cBm15MLqrbf83Bv4o5HU8qNCr3YPAKHM5crogCTpPTzXLirT4G00kNdiIILG
```

#### Backend (Supabase Edge Functions):
```bash
# Set these via Supabase CLI
STRIPE_SECRET_KEY=sk_live_[your-secret-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]
```

## Testing Production Payments

### 1. Pre-Launch Testing
Before going fully live:
1. Create a test purchase with a real card (you can refund it)
2. Verify webhook receives the event
3. Check credits are added correctly
4. Confirm receipt email is sent

### 2. Monitor First Transactions
- Watch Stripe Dashboard for successful payments
- Check Supabase logs for webhook processing
- Verify database updates (payment_history table)

## Security Checklist

- [ ] Secret key is ONLY in Supabase Edge Functions
- [ ] Webhook endpoint uses signature verification
- [ ] HTTPS is enforced on all endpoints
- [ ] Rate limiting is configured
- [ ] Fraud detection rules are set up in Stripe

## Common Issues and Solutions

### Issue: Webhook not receiving events
- Check endpoint URL is correct
- Verify Edge Function is deployed
- Check Supabase function logs

### Issue: Payment succeeds but credits not added
- Check webhook secret is correct
- Verify database permissions
- Check Edge Function logs for errors

### Issue: 403 errors on payment
- Ensure production domain is in allowed origins
- Check CORS configuration in Edge Functions

## Monitoring

1. **Stripe Dashboard**: https://dashboard.stripe.com
   - View live transactions
   - Monitor failed payments
   - Check webhook status

2. **Supabase Logs**:
   ```bash
   npx supabase functions logs stripe-webhook --tail
   npx supabase functions logs create-payment --tail
   ```

3. **Key Metrics to Track**:
   - Payment success rate
   - Average transaction value
   - Webhook success rate
   - Credit fulfillment rate

## Support Contacts

- **Stripe Support**: https://support.stripe.com
- **Urgent Issues**: Available 24/7 via Stripe Dashboard

---

**Important**: Always test with small amounts first when going live!

Last Updated: August 2025