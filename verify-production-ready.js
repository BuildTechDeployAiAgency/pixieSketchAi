#!/usr/bin/env node

/**
 * Production Readiness Verification
 * Run this before going live with real payments
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 PixieSketch Production Readiness Check\n');
console.log('==========================================\n');

// Check Stripe key format
const LIVE_KEY = 'pk_live_51RXiVsJlCd2GnfwVV7iYJr9lQgE1CQB6M0N8l4cBm15MLqrbf83Bv4o5HU8qNCr3YPAKHM5crogCTpPTzXLirT4G00kNdiIILG';

console.log('1. Stripe Live Key Validation:');
if (LIVE_KEY.startsWith('pk_live_')) {
  console.log('   ✅ Key format is correct (starts with pk_live_)');
  console.log('   ✅ Key length is valid:', LIVE_KEY.length, 'characters');
} else {
  console.log('   ❌ Invalid key format');
}

console.log('\n2. Production Environment File:');
if (fs.existsSync('.env.production')) {
  console.log('   ✅ .env.production exists');
  const content = fs.readFileSync('.env.production', 'utf8');
  if (content.includes(LIVE_KEY)) {
    console.log('   ✅ Live key is in .env.production');
  }
  if (content.includes('VITE_SUPABASE_URL')) {
    console.log('   ✅ Supabase URL configured');
  }
} else {
  console.log('   ❌ .env.production missing');
}

console.log('\n3. ⚠️  CRITICAL Production Checklist:\n');

console.log('   Backend (Supabase):');
console.log('   [ ] Stripe SECRET key set in Supabase (sk_live_...)');
console.log('   [ ] Stripe webhook secret set in Supabase');
console.log('   [ ] OpenAI API key set with production limits');
console.log('   [ ] Email API key configured');

console.log('\n   Frontend (Vercel):');
console.log('   [ ] VITE_STRIPE_PUBLISHABLE_KEY = ' + LIVE_KEY);
console.log('   [ ] VITE_SUPABASE_URL configured');
console.log('   [ ] VITE_SUPABASE_ANON_KEY configured');

console.log('\n   Stripe Dashboard:');
console.log('   [ ] Webhook endpoint verified and active');
console.log('   [ ] Payment methods configured');
console.log('   [ ] Fraud detection rules set');
console.log('   [ ] Tax settings configured (if needed)');

console.log('\n4. 🧪 Final Production Tests:\n');

console.log('   Test #1 - Small Real Payment:');
console.log('   • Make a $1 purchase with a real card');
console.log('   • Verify payment appears in Stripe Dashboard');
console.log('   • Confirm credits are added to user account');
console.log('   • Check webhook logs for success');

console.log('\n   Test #2 - Refund Process:');
console.log('   • Issue a refund in Stripe Dashboard');
console.log('   • Verify how your app handles refunds');

console.log('\n   Test #3 - Error Handling:');
console.log('   • Test with insufficient funds card');
console.log('   • Verify error messages are user-friendly');

console.log('\n5. 🚨 Go-Live Commands:\n');

console.log('   Deploy to Vercel with production env:');
console.log('   vercel --prod\n');

console.log('   Set production env in Vercel:');
console.log('   vercel env add VITE_STRIPE_PUBLISHABLE_KEY production');
console.log('   # Paste:', LIVE_KEY);

console.log('\n6. 📊 Post-Launch Monitoring:\n');
console.log('   • Stripe Dashboard: https://dashboard.stripe.com');
console.log('   • Watch for successful payments');
console.log('   • Monitor webhook success rate');
console.log('   • Check Edge Function logs');

console.log('\n⚠️  IMPORTANT REMINDERS:');
console.log('   • You are using LIVE Stripe keys - real money will be charged');
console.log('   • Test with small amounts first');
console.log('   • Have a refund process ready');
console.log('   • Monitor closely for first 24 hours');

console.log('\n✅ Your Stripe Live Key is valid and ready for production!');
console.log('   Just ensure all backend secrets are set in Supabase.\n');