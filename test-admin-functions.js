// Test script for admin functions and budget system
// Run this script in the browser console while logged in as admin

console.log('🧪 Testing Admin Functions and Budget System');

// Test function to invoke admin operations
async function testAdminOperation(operation, params = {}) {
  console.log(`\n🔄 Testing operation: ${operation}`);
  
  try {
    const response = await fetch('/rest/v1/functions/v1/admin-operations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sb-uihnpebacpcndtkdizxd-auth-token')?.match(/"access_token":"([^"]+)"/)?.[1] || 'NO_TOKEN'}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpaG5wZWJhY3BjbmR0a2RpenhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTk4ODIsImV4cCI6MjA2NDkzNTg4Mn0.is_-3d_8FWrU7ge8y69zV6U4-QZhilk_FOH26clxqBo'
      },
      body: JSON.stringify({
        operation,
        ...params
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${operation} successful:`, result);
    } else {
      console.error(`❌ ${operation} failed:`, result);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ ${operation} error:`, error);
    return null;
  }
}

// Test budget statistics
async function testBudgetStats() {
  console.log('\n📊 Testing Budget Statistics...');
  return await testAdminOperation('get_budget_stats');
}

// Test reset all credits
async function testResetAllCredits() {
  console.log('\n🔄 Testing Reset All Credits...');
  const confirmed = confirm('This will reset ALL user credits to 0. Continue?');
  if (confirmed) {
    return await testAdminOperation('reset_all_credits');
  } else {
    console.log('❌ Test cancelled by user');
    return null;
  }
}

// Test creating a budget period
async function testCreateBudgetPeriod() {
  console.log('\n📅 Testing Create Budget Period...');
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  
  return await testAdminOperation('create_budget_period', {
    periodName: 'Test Budget Period',
    totalLimit: 500,
    periodStart: startDate.toISOString(),
    periodEnd: endDate.toISOString(),
    alertThreshold: 400,
    hardLimitEnabled: false
  });
}

// Test updating budget settings
async function testUpdateBudgetSettings(periodId) {
  console.log('\n⚙️ Testing Update Budget Settings...');
  
  if (!periodId) {
    console.log('❌ No period ID provided');
    return null;
  }
  
  return await testAdminOperation('update_budget_settings', {
    periodId: periodId,
    totalLimit: 750,
    alertThreshold: 600,
    hardLimitEnabled: true
  });
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive admin function tests...');
  
  // Test budget stats
  const budgetStats = await testBudgetStats();
  
  // Test create budget period
  const createResult = await testCreateBudgetPeriod();
  
  // If we created a period, test updating it
  if (createResult?.success && createResult?.data?.period_id) {
    await testUpdateBudgetSettings(createResult.data.period_id);
  }
  
  // Test budget stats again to see changes
  await testBudgetStats();
  
  console.log('\n🏁 All tests completed!');
}

// Export functions to global scope for manual testing
window.testAdminFunctions = {
  testBudgetStats,
  testResetAllCredits,
  testCreateBudgetPeriod,
  testUpdateBudgetSettings,
  runAllTests
};

console.log(`
🎯 Admin Functions Test Suite Ready!

Available test functions:
- testAdminFunctions.testBudgetStats()
- testAdminFunctions.testResetAllCredits()
- testAdminFunctions.testCreateBudgetPeriod()
- testAdminFunctions.testUpdateBudgetSettings(periodId)
- testAdminFunctions.runAllTests()

To run all tests: testAdminFunctions.runAllTests()
`);

// Auto-run budget stats test
testBudgetStats();