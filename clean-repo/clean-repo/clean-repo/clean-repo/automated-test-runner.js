// Automated Test Runner for PixieSketch Credit System
// Run this in browser console after each manual test step
// Provides real-time validation and progress tracking

class PixieSketchTestRunner {
  constructor() {
    this.testResults = {
      phase1: [],
      phase2: [],
      phase3: [],
      phase4: [],
      phase5: []
    };
    this.startTime = Date.now();
  }

  // Utility Methods
  log(message, type = 'info', phase = null) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'pass': '✅',
      'fail': '❌', 
      'warn': '⚠️',
      'info': 'ℹ️',
      'progress': '🔄'
    }[type] || 'ℹ️';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
    
    if (phase) {
      this.testResults[phase].push({
        timestamp,
        type,
        message,
        passed: type === 'pass'
      });
    }
  }

  // Phase 1 Tests - Authentication & UI
  validatePhase1() {
    this.log('🧪 PHASE 1: Authentication & UI Validation', 'progress');
    
    // Test 1.1: Authentication
    const isAuthenticated = this.checkAuthentication();
    this.log(`Authentication Status: ${isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`, 
      isAuthenticated ? 'pass' : 'fail', 'phase1');
    
    // Test 1.2: Credit Display
    const creditInfo = this.getCreditInfo();
    this.log(`Credit Display: ${creditInfo.found ? `${creditInfo.amount} credits shown` : 'NOT FOUND'}`,
      creditInfo.found ? 'pass' : 'fail', 'phase1');
    
    // Test 1.3: Buy Credits Button
    const buyButton = this.findBuyCreditsButton();
    this.log(`Buy Credits Button: ${buyButton ? 'FOUND' : 'NOT FOUND'}`,
      buyButton ? 'pass' : 'fail', 'phase1');
    
    // Test 1.4: Pricing Options
    const pricing = this.validatePricingOptions();
    this.log(`$1.00 Option: ${pricing.single ? 'FOUND' : 'MISSING'}`,
      pricing.single ? 'pass' : 'fail', 'phase1');
    this.log(`$4.99 Option: ${pricing.pack ? 'FOUND' : 'MISSING'}`,
      pricing.pack ? 'pass' : 'fail', 'phase1');
    this.log(`$9.99 Option: ${pricing.super ? 'FOUND' : 'MISSING'}`,
      pricing.super ? 'pass' : 'fail', 'phase1');
      
    return isAuthenticated && creditInfo.found && buyButton && pricing.single && pricing.pack && pricing.super;
  }

  // Phase 2 Tests - Credit Purchases
  validatePhase2AfterPurchase(expectedCredits, purchaseType) {
    this.log(`🧪 PHASE 2: Validating ${purchaseType} Purchase`, 'progress');
    
    const creditInfo = this.getCreditInfo();
    const success = creditInfo.amount === expectedCredits;
    
    this.log(`Expected Credits: ${expectedCredits}, Actual: ${creditInfo.amount}`,
      success ? 'pass' : 'fail', 'phase2');
    
    // Check if payment history updated
    this.suggestPaymentHistoryCheck();
    
    return success;
  }

  // Phase 3 Tests - Processing
  validatePhase3BeforeProcessing() {
    this.log('🧪 PHASE 3: Pre-Processing Validation', 'progress');
    
    const uploadArea = this.findUploadArea();
    const presets = this.findPresetButtons();
    const credits = this.getCreditInfo();
    
    this.log(`Upload Area: ${uploadArea ? 'FOUND' : 'NOT FOUND'}`,
      uploadArea ? 'pass' : 'fail', 'phase3');
    this.log(`Preset Buttons: ${presets.count} found`,
      presets.count >= 3 ? 'pass' : 'fail', 'phase3');
    this.log(`Available Credits: ${credits.amount}`,
      credits.amount > 0 ? 'pass' : 'warn', 'phase3');
      
    return uploadArea && presets.count >= 3;
  }

  validatePhase3AfterProcessing(initialCredits) {
    this.log('🧪 PHASE 3: Post-Processing Validation', 'progress');
    
    const currentCredits = this.getCreditInfo();
    const expectedCredits = initialCredits - 1;
    const success = currentCredits.amount === expectedCredits;
    
    this.log(`Credit Deduction: ${initialCredits} → ${currentCredits.amount} (expected ${expectedCredits})`,
      success ? 'pass' : 'fail', 'phase3');
      
    return success;
  }

  // Phase 4 Tests - Error Handling  
  validatePhase4InsufficientCredits() {
    this.log('🧪 PHASE 4: Insufficient Credits Validation', 'progress');
    
    const credits = this.getCreditInfo();
    const errorMessages = this.checkForErrorMessages();
    
    this.log(`Current Credits: ${credits.amount}`, 'info', 'phase4');
    this.log(`Error Messages Found: ${errorMessages.length}`,
      errorMessages.length > 0 ? 'pass' : 'fail', 'phase4');
      
    return credits.amount === 0 && errorMessages.length > 0;
  }

  // Phase 5 Tests - Advanced
  validatePhase5RealtimeSync() {
    this.log('🧪 PHASE 5: Real-time Sync Test', 'progress');
    this.log('Manual validation required: Open multiple tabs and test sync', 'warn', 'phase5');
    return true; // Manual test
  }

  // Helper Methods
  checkAuthentication() {
    const header = document.querySelector('header')?.textContent || '';
    return header.includes('@') || header.includes('Sign Out');
  }

  getCreditInfo() {
    const header = document.querySelector('header')?.textContent || '';
    const match = header.match(/(\d+)\s+Credits?/i);
    return {
      found: !!match,
      amount: match ? parseInt(match[1]) : 0
    };
  }

  findBuyCreditsButton() {
    const buttons = [...document.querySelectorAll('button')];
    return buttons.some(btn => 
      btn.textContent.toLowerCase().includes('buy credits') ||
      btn.textContent.toLowerCase().includes('buy')
    );
  }

  validatePricingOptions() {
    const pageText = document.body.textContent;
    return {
      single: pageText.includes('$1') && pageText.includes('1'),
      pack: pageText.includes('$4.99') && pageText.includes('10'),
      super: pageText.includes('$9.99') && pageText.includes('25')
    };
  }

  findUploadArea() {
    return !!document.querySelector('input[type="file"]');
  }

  findPresetButtons() {
    const buttons = [...document.querySelectorAll('button')];
    const presetButtons = buttons.filter(btn => {
      const text = btn.textContent.toLowerCase();
      return text.includes('cartoon') || text.includes('pixar') || text.includes('realistic');
    });
    return { count: presetButtons.length };
  }

  checkForErrorMessages() {
    const pageText = document.body.textContent.toLowerCase();
    const errorPatterns = [
      'insufficient credits',
      'no credits',
      'need credits',
      'purchase credits'
    ];
    return errorPatterns.filter(pattern => pageText.includes(pattern));
  }

  suggestPaymentHistoryCheck() {
    this.log('💡 Suggestion: Check Payment History page to verify transaction recorded', 'info');
  }

  // Monitoring Tools
  startCreditMonitoring() {
    this.log('🔍 Starting Credit Balance Monitor...', 'progress');
    this.creditMonitor = setInterval(() => {
      const credits = this.getCreditInfo();
      console.log(`💰 Current Credits: ${credits.amount} (${new Date().toLocaleTimeString()})`);
    }, 2000);
  }

  stopCreditMonitoring() {
    if (this.creditMonitor) {
      clearInterval(this.creditMonitor);
      this.log('🔍 Credit monitoring stopped', 'info');
    }
  }

  // Database Validation Helper
  suggestDatabaseCheck() {
    this.log('💡 Database Validation Commands:', 'info');
    console.log(`
🗄️ Check these in Supabase SQL Editor:

-- Check user profiles and credits
SELECT email, credits, updated_at FROM profiles ORDER BY updated_at DESC;

-- Check payment history
SELECT 
  customer_email,
  amount/100.0 as amount_dollars,
  credits_purchased,
  payment_status,
  created_at
FROM payment_history 
ORDER BY created_at DESC;

-- Check for duplicate payments
SELECT stripe_session_id, COUNT(*) as count
FROM payment_history 
GROUP BY stripe_session_id 
HAVING COUNT(*) > 1;
    `);
  }

  // Complete Test Report
  generateTestReport() {
    const duration = (Date.now() - this.startTime) / 1000;
    
    this.log('\n📊 COMPREHENSIVE TEST REPORT', 'progress');
    this.log('================================', 'info');
    
    let totalTests = 0;
    let passedTests = 0;
    
    Object.entries(this.testResults).forEach(([phase, results]) => {
      const phaseTests = results.length;
      const phasePassed = results.filter(r => r.passed).length;
      totalTests += phaseTests;
      passedTests += phasePassed;
      
      if (phaseTests > 0) {
        this.log(`${phase.toUpperCase()}: ${phasePassed}/${phaseTests} passed`, 'info');
      }
    });
    
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
    this.log(`OVERALL: ${passedTests}/${totalTests} tests passed (${successRate}%)`, 'info');
    this.log(`Duration: ${duration.toFixed(1)} seconds`, 'info');
    
    if (passedTests === totalTests) {
      this.log('🎉 ALL TESTS PASSED!', 'pass');
    } else {
      this.log('🔧 Some tests failed - review results above', 'warn');
    }
    
    this.suggestDatabaseCheck();
  }
}

// Create global test runner instance
window.testRunner = new PixieSketchTestRunner();

// Quick test commands
window.quickTest = {
  phase1: () => testRunner.validatePhase1(),
  phase2: (expected, type) => testRunner.validatePhase2AfterPurchase(expected, type),
  phase3Pre: () => testRunner.validatePhase3BeforeProcessing(),
  phase3Post: (initial) => testRunner.validatePhase3AfterProcessing(initial),
  phase4: () => testRunner.validatePhase4InsufficientCredits(),
  phase5: () => testRunner.validatePhase5RealtimeSync(),
  startMonitor: () => testRunner.startCreditMonitoring(),
  stopMonitor: () => testRunner.stopCreditMonitoring(),
  report: () => testRunner.generateTestReport(),
  credits: () => testRunner.getCreditInfo()
};

// Initialize
console.log(`
🧪 PixieSketch Test Runner Loaded!

Quick Commands:
- quickTest.phase1()           // Validate authentication & UI
- quickTest.phase2(1, '$1')    // After $1.00 purchase (expect 1 credit)
- quickTest.phase2(11, '$4.99') // After $4.99 purchase (expect 11 total)
- quickTest.phase2(36, '$9.99') // After $9.99 purchase (expect 36 total)
- quickTest.phase3Pre()        // Before image processing
- quickTest.phase3Post(36)     // After processing (initial credit count)
- quickTest.phase4()           // Insufficient credits test
- quickTest.startMonitor()     // Watch credit changes in real-time
- quickTest.stopMonitor()      // Stop monitoring
- quickTest.credits()          // Current credit info
- quickTest.report()           // Final test report

Example Usage:
1. Reset credits in Supabase dashboard
2. Run: quickTest.phase1()
3. Purchase $1.00 package
4. Run: quickTest.phase2(1, '$1.00')
5. Continue with other phases...
`);

testRunner.log('🚀 Test Runner Ready! Start with quickTest.phase1()', 'progress');