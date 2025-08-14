#!/usr/bin/env node

/**
 * Stripe Production Setup Verification Script
 * Run this to verify your Stripe production setup is correct
 */

console.log('🔍 Verifying Stripe Production Setup...\n');

// Check environment files
const fs = require('fs');
const path = require('path');

// Check .env.production
const envProdPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envProdPath)) {
  console.log('✅ .env.production file exists');
  const envContent = fs.readFileSync(envProdPath, 'utf8');
  
  if (envContent.includes('pk_live_')) {
    console.log('✅ Production publishable key found');
  } else {
    console.log('❌ Production publishable key NOT found');
  }
} else {
  console.log('❌ .env.production file NOT found');
}

// Check if .env.production is gitignored
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env.production')) {
    console.log('✅ .env.production is gitignored');
  } else {
    console.log('⚠️  WARNING: .env.production should be added to .gitignore');
  }
}

console.log('\n📋 Production Setup Checklist:\n');

console.log('1. Frontend Environment Variable:');
console.log('   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RXiVsJlCd2GnfwVV7iYJr9lQgE1CQB6M0N8l4cBm15MLqrbf83Bv4o5HU8qNCr3YPAKHM5crogCTpPTzXLirT4G00kNdiIILG');

console.log('\n2. Backend Secrets (set in Supabase):');
console.log('   - STRIPE_SECRET_KEY (get from Stripe Dashboard)');
console.log('   - STRIPE_WEBHOOK_SECRET (get after creating webhook)');

console.log('\n3. Stripe Webhook URL:');
console.log('   https://uihnpebacpcndtkdizxd.supabase.co/functions/v1/stripe-webhook');

console.log('\n4. Required Webhook Events:');
console.log('   - checkout.session.completed');
console.log('   - payment_intent.succeeded');
console.log('   - payment_intent.payment_failed');

console.log('\n5. Deploy Commands:');
console.log('   npx supabase functions deploy create-payment --no-verify-jwt');
console.log('   npx supabase functions deploy stripe-webhook --no-verify-jwt');
console.log('   npx supabase functions deploy verify-payment --no-verify-jwt');

console.log('\n🔐 Security Reminders:');
console.log('   - NEVER commit secret keys to git');
console.log('   - Use Vercel environment variables for production');
console.log('   - Test with small amounts first');

console.log('\n✨ Next Steps:');
console.log('   1. Get your secret key from Stripe Dashboard (Live mode)');
console.log('   2. Set secrets in Supabase');
console.log('   3. Create webhook in Stripe Dashboard');
console.log('   4. Deploy Edge Functions');
console.log('   5. Deploy frontend to Vercel');

console.log('\n📖 Full guide: documentation/STRIPE-PRODUCTION-SETUP.md');