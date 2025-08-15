#!/usr/bin/env node

/**
 * Production Issues Diagnostic Script
 * Identifies and helps fix production Edge Function errors
 */

console.log('🔍 Diagnosing Production Issues\n');
console.log('================================\n');

console.log('1. 🌐 CORS Configuration Issue\n');
console.log('   Current allowed origins in Edge Functions:');
console.log('   - http://localhost:8080');
console.log('   - https://pixie-sketch-ai.vercel.app');
console.log('   - https://pixiesketch.com');
console.log('\n   ❓ What is your actual production URL?');
console.log('   If it\'s different, we need to add it to all Edge Functions.\n');

console.log('2. 🔑 Environment Variables Check\n');
console.log('   Frontend needs (in Vercel):');
console.log('   - VITE_SUPABASE_URL');
console.log('   - VITE_SUPABASE_ANON_KEY');
console.log('   - VITE_STRIPE_PUBLISHABLE_KEY\n');

console.log('   Backend needs (in Supabase):');
console.log('   - OPENAI_API_KEY');
console.log('   - STRIPE_SECRET_KEY');
console.log('   - STRIPE_WEBHOOK_SECRET');
console.log('   - EMAIL_API_KEY\n');

console.log('3. 🔧 Quick Fixes to Try:\n');

console.log('   Fix A: Add your production domain to Edge Functions');
console.log('   If your domain is different from the allowed ones, update all Edge Functions.\n');

console.log('   Fix B: Check Supabase Edge Function logs');
console.log('   npx supabase functions logs create-payment --tail');
console.log('   npx supabase functions logs process-sketch --tail\n');

console.log('   Fix C: Test with curl to bypass CORS');
console.log('   curl -X POST https://uihnpebacpcndtkdizxd.supabase.co/functions/v1/admin-operations \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -H "Authorization: Bearer YOUR_ANON_KEY" \\');
console.log('     -d \'{"operation":"health"}\'\n');

console.log('4. 📝 Files to Update:\n');

const functionsToUpdate = [
  'admin-operations',
  'analyze-drawing',
  'create-payment',
  'process-sketch',
  'send-email',
  'stripe-webhook',
  'verify-payment'
];

functionsToUpdate.forEach(func => {
  console.log(`   - supabase/functions/${func}/index.ts`);
});

console.log('\n5. 🚀 After Fixing:\n');
console.log('   1. Redeploy all Edge Functions:');
console.log('      ./deploy-edge-functions.sh\n');
console.log('   2. Clear browser cache and cookies');
console.log('   3. Test in incognito mode\n');

console.log('6. 🐛 For Sketches Not Loading:\n');
console.log('   - Check browser console for errors');
console.log('   - Verify user is authenticated');
console.log('   - Check Supabase RLS policies');
console.log('   - Test with: SELECT * FROM sketches WHERE user_id = \'your-user-id\'\n');

console.log('📋 Action Items:');
console.log('1. Tell me your production domain URL');
console.log('2. Check Vercel environment variables');
console.log('3. Check Supabase Edge Function secrets');
console.log('4. Look at Edge Function logs for specific errors\n');