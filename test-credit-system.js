// Credit System Testing Script
// Run this in the browser console on localhost:8081

console.log('🧪 Starting Credit System Testing...');

// Test 1: Check current credit display
async function testCreditDisplay() {
  console.log('\n=== Test 1: Credit Display Accuracy ===');
  
  // Check if user is authenticated
  const creditBalance = document.querySelector('[data-testid="credit-balance"]') || 
                      document.querySelector('*').textContent.match(/(\d+)\s+Credits?/);
  
  if (creditBalance) {
    console.log('✅ Credit display found:', creditBalance);
  } else {
    console.log('❌ Credit display not found - user may not be authenticated');
  }
  
  // Check header credit display
  const headerCredit = document.querySelector('header').textContent.match(/(\d+)\s+Credits?/);
  if (headerCredit) {
    console.log('✅ Header credit display:', headerCredit[1]);
  } else {
    console.log('❌ Header credit display not found');
  }
}

// Test 2: Check PaymentModal pricing
async function testPaymentModalPricing() {
  console.log('\n=== Test 2: Payment Modal Pricing ===');
  
  // Try to find and click "Buy Credits" button
  const buyCreditsBtn = [...document.querySelectorAll('button')].find(btn => 
    btn.textContent.includes('Buy Credits') || btn.textContent.includes('Buy')
  );
  
  if (buyCreditsBtn) {
    console.log('✅ Buy Credits button found');
    // Note: We won't auto-click to avoid accidental purchases
    console.log('🔍 Manual step: Click "Buy Credits" to open modal and verify:');
    console.log('   - $1.00 = 1 credit option exists');
    console.log('   - $4.99 = 10 credits option exists'); 
    console.log('   - $9.99 = 25 credits option exists');
  } else {
    console.log('❌ Buy Credits button not found');
  }
}

// Test 3: Check pricing on main page
async function testMainPagePricing() {
  console.log('\n=== Test 3: Main Page Pricing ===');
  
  const pricingSection = document.querySelector('*').textContent;
  
  // Check for $1 option
  if (pricingSection.includes('$1') || pricingSection.includes('Single Magic')) {
    console.log('✅ $1.00 Single Magic option found');
  } else {
    console.log('❌ $1.00 Single Magic option missing');
  }
  
  // Check for $4.99 option
  if (pricingSection.includes('$4.99') || pricingSection.includes('Magic Pack')) {
    console.log('✅ $4.99 Magic Pack option found');
  } else {
    console.log('❌ $4.99 Magic Pack option missing');
  }
  
  // Check for $9.99 option
  if (pricingSection.includes('$9.99') || pricingSection.includes('Super Magic')) {
    console.log('✅ $9.99 Super Magic option found');
  } else {
    console.log('❌ $9.99 Super Magic option missing');
  }
}

// Test 4: Check authentication status
async function testAuthStatus() {
  console.log('\n=== Test 4: Authentication Status ===');
  
  const authSection = document.querySelector('header').textContent;
  
  if (authSection.includes('@') || authSection.includes('Sign Out')) {
    console.log('✅ User appears to be authenticated');
  } else if (authSection.includes('Sign In') || authSection.includes('Log In')) {
    console.log('❌ User not authenticated - sign in required for credit testing');
  } else {
    console.log('❓ Authentication status unclear');
  }
}

// Run all tests
async function runAllTests() {
  await testAuthStatus();
  await testCreditDisplay();
  await testMainPagePricing();
  await testPaymentModalPricing();
  
  console.log('\n🎯 Testing Summary:');
  console.log('Phase 1 tests completed. Check results above.');
  console.log('Manual steps needed:');
  console.log('1. Ensure user is authenticated');
  console.log('2. Check payment modal pricing manually');
  console.log('3. Test actual purchase flow in Stripe test mode');
}

// Start testing
runAllTests();