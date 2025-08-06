# Stripe Payment Setup Guide

## 🚨 IMPORTANT: You provided the publishable key, but we need the SECRET key

### What You Provided:

- ✅ **Publishable Key** (pk*live*...): For frontend use - SAFE to share
- ❌ **Secret Key** (sk*live*...): For backend use - NEVER share this

## 🔐 Steps to Complete Stripe Setup:

### 1. Get Your Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Find your **Secret key** (starts with `sk_live_...`)
3. Copy it (keep it secure!)

### 2. Add Secret Key to Supabase

Run this command in your terminal:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_STRIPE_SECRET_KEY_HERE
```

### 3. Update Success/Cancel URLs

In `/supabase/functions/create-payment/index.ts`, update the URLs from localhost to your production domain:

```typescript
success_url: 'https://pixiesketch.com/payment-success?session_id={CHECKOUT_SESSION_ID}&credits=' + credits,
cancel_url: 'https://pixiesketch.com/payment-canceled',
```

### 4. Test Before Going Live

1. Use Stripe TEST mode first:

   - Test Publishable Key: `pk_test_...`
   - Test Secret Key: `sk_test_...`
   - Test Card: `4242 4242 4242 4242`

2. Verify everything works in test mode

3. Switch to LIVE keys when ready

## 🎯 Current Configuration:

### Frontend (.env.local)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RXiVsJlCd2GnfwVV7iYJr9lQgE1CQB6M0N8l4cBm15MLqrbf83Bv4o5HU8qNCr3YPAKHM5crogCTpPTzXLirT4G00kNdiIILG
```

### Backend (Supabase Secrets) - NEEDS TO BE SET

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
```

## 💰 Payment Products Configured:

1. **Single Magic Transform**: $1.00 (1 credit)
2. **Magic Pack**: $4.99 (10 credits) - POPULAR
3. **Super Magic Pack**: $9.99 (25 credits)

## ⚠️ Security Reminders:

- NEVER commit secret keys to Git
- NEVER share secret keys in messages
- Use environment variables for all keys
- Test with TEST mode keys first
- Monitor your Stripe dashboard for suspicious activity

## 📊 Webhook Setup (Recommended)

For better reliability and security, set up webhooks:

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://uihnpebacpcndtkdizxd.supabase.co/functions/v1/stripe-webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret
5. Add to Supabase: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

## Need Help?

- Check Stripe Logs: https://dashboard.stripe.com/logs
- Test payments: https://stripe.com/docs/testing
- Contact Stripe Support for account issues
