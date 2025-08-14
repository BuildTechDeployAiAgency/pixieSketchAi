# Production Deployment Checklist for PixieSketch

## Pre-Deployment Requirements

### 1. API Keys and Services
- [ ] **OpenAI Account** with API access
  - [ ] Production API key generated
  - [ ] Billing enabled with spending limits
  - [ ] GPT-4 Vision and DALL-E 3 access confirmed

- [ ] **Stripe Account** in live mode
  - [ ] Production secret key (sk_live_...)
  - [ ] Production publishable key (pk_live_...)
  - [ ] Webhook endpoint created
  - [ ] Webhook signing secret obtained
  - [ ] Payment methods configured
  - [ ] Tax settings configured (if applicable)

- [ ] **Resend/SendGrid Account**
  - [ ] Production API key generated
  - [ ] Domain verified for sending
  - [ ] SPF/DKIM records configured

- [ ] **Supabase Project**
  - [ ] Production project created (separate from dev)
  - [ ] Database schema applied
  - [ ] RLS policies enabled
  - [ ] Service role key noted

### 2. Domain and Hosting
- [ ] Production domain registered (e.g., pixiesketch.com)
- [ ] DNS configured for Vercel
- [ ] SSL certificate auto-configured by Vercel

## Deployment Steps

### Phase 1: Database Setup

1. **Apply Database Schema**
   ```sql
   -- In Supabase SQL Editor, run in order:
   1. Main schema (tables, RLS policies)
   2. credit-budget-system.sql
   3. admin-policies.sql
   4. payment-history-schema.sql
   ```

2. **Verify Database**
   - [ ] All tables created
   - [ ] RLS policies active
   - [ ] Admin functions working
   - [ ] Test user creation

### Phase 2: Edge Functions Deployment

1. **Set Production Secrets**
   ```bash
   npx supabase secrets set OPENAI_API_KEY="sk-..."
   npx supabase secrets set STRIPE_SECRET_KEY="sk_live_..."
   npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
   npx supabase secrets set EMAIL_API_KEY="re_..."
   ```

2. **Deploy All Edge Functions**
   ```bash
   npx supabase functions deploy admin-operations --no-verify-jwt
   npx supabase functions deploy analyze-drawing --no-verify-jwt
   npx supabase functions deploy process-sketch --no-verify-jwt
   npx supabase functions deploy create-payment --no-verify-jwt
   npx supabase functions deploy send-email --no-verify-jwt
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   npx supabase functions deploy verify-payment --no-verify-jwt
   ```

3. **Verify Edge Functions**
   - [ ] All functions listed in dashboard
   - [ ] Test health check endpoint
   - [ ] Check function logs

### Phase 3: Frontend Deployment

1. **Prepare Production Build**
   - [ ] Update environment variables
   - [ ] Test production build locally
   ```bash
   npm run build
   npm run preview
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure Vercel Environment**
   ```
   VITE_SUPABASE_URL=https://[your-project].supabase.co
   VITE_SUPABASE_ANON_KEY=[production-anon-key]
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_[your-key]
   ```

### Phase 4: Stripe Configuration

1. **Configure Webhook Endpoint**
   - URL: `https://[your-project].supabase.co/functions/v1/stripe-webhook`
   - Events to listen:
     - [ ] checkout.session.completed
     - [ ] payment_intent.succeeded
     - [ ] payment_intent.payment_failed

2. **Set Up Products** (if using Stripe Products)
   - [ ] Create payment packages
   - [ ] Set correct prices
   - [ ] Configure metadata

### Phase 5: Post-Deployment Configuration

1. **Update Allowed Origins**
   - [ ] Add production domain to Supabase Auth settings
   - [ ] Update Google OAuth redirect URLs
   - [ ] Verify CORS headers in Edge Functions

2. **Configure Email**
   - [ ] Test email sending
   - [ ] Verify receipts formatting
   - [ ] Check spam score

## Testing Checklist

### Critical Path Testing

1. **User Registration Flow**
   - [ ] Email/password signup
   - [ ] Google OAuth signup
   - [ ] Profile creation
   - [ ] Starting credits (10) assigned

2. **AI Transformation Flow**
   - [ ] File upload works
   - [ ] AI analysis processes
   - [ ] Transformation completes
   - [ ] Credits deducted correctly

3. **Payment Flow**
   - [ ] Checkout initiates
   - [ ] Payment processes
   - [ ] Credits added on success
   - [ ] Receipt email sent

4. **Admin Functions**
   - [ ] Admin login works
   - [ ] Manual credit adjustment
   - [ ] User management
   - [ ] Budget statistics load

### Performance Testing

- [ ] Page load times < 3 seconds
- [ ] Image upload < 50MB works
- [ ] AI processing completes < 30 seconds
- [ ] Concurrent user testing

### Security Testing

- [ ] No exposed API keys in frontend
- [ ] RLS policies prevent unauthorized access
- [ ] Admin functions restricted properly
- [ ] HTTPS enforced everywhere

## Monitoring Setup

### 1. Application Monitoring
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Performance monitoring active

### 2. Service Monitoring
- [ ] Supabase dashboard bookmarked
- [ ] Stripe dashboard bookmarked
- [ ] OpenAI usage dashboard bookmarked

### 3. Alert Configuration
- [ ] Email alerts for errors
- [ ] Webhook failure notifications
- [ ] Budget threshold alerts

## Go-Live Checklist

### Final Checks
- [ ] All test accounts removed
- [ ] Debug logging disabled
- [ ] Error messages user-friendly
- [ ] Terms of Service updated
- [ ] Privacy Policy updated

### Launch Steps
1. [ ] Deploy frontend to production
2. [ ] Update DNS records
3. [ ] Test production URL
4. [ ] Monitor first 24 hours closely

### Post-Launch
- [ ] Document any issues found
- [ ] Update runbooks
- [ ] Schedule first key rotation
- [ ] Plan first feature update

## Rollback Plan

If critical issues arise:

1. **Frontend Rollback**
   ```bash
   vercel rollback
   ```

2. **Edge Function Rollback**
   ```bash
   # Redeploy previous version
   git checkout [previous-commit]
   npx supabase functions deploy [function-name]
   ```

3. **Database Rollback**
   - Use Supabase point-in-time recovery
   - Or restore from backup

## Support Information

### Key Contacts
- **On-Call Developer**: [Contact info]
- **Stripe Support**: support@stripe.com
- **Supabase Support**: support@supabase.com
- **Domain Registrar**: [Support info]

### Documentation
- API Key Security: `/documentation/API-KEY-SECURITY.md`
- Edge Functions Guide: `/documentation/EDGE-FUNCTIONS-DEPLOYMENT.md`
- Troubleshooting: `/documentation/EDGE-FUNCTION-TROUBLESHOOTING.md`

---

**Important**: Complete all items before marking deployment as successful.

Last Updated: August 2025
Version: 1.0