// Admin Panel Debug Script
// Run this in browser console to diagnose admin access issues

console.log('🔍 ADMIN PANEL DEBUGGER');
console.log('=====================');

class AdminDebugger {
  constructor() {
    this.issues = [];
  }

  log(message, type = 'info') {
    const prefix = {
      'error': '❌',
      'warn': '⚠️', 
      'success': '✅',
      'info': 'ℹ️'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'error' || type === 'warn') {
      this.issues.push(message);
    }
  }

  // Check 1: Current authentication status
  async checkAuth() {
    this.log('🔍 Checking authentication status...');
    
    try {
      if (typeof supabase === 'undefined') {
        this.log('Supabase client not available', 'error');
        return false;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        this.log(`Auth error: ${error.message}`, 'error');
        return false;
      }

      if (!user) {
        this.log('No user logged in', 'error');
        return false;
      }

      this.log(`Logged in as: ${user.email}`, 'success');
      
      // Check if this is the admin email
      const isAdmin = user.email === 'diogo@diogoppedro.com';
      this.log(`Is admin user: ${isAdmin}`, isAdmin ? 'success' : 'error');
      
      if (!isAdmin) {
        this.log('Current user is not the admin. Admin email should be: diogo@diogoppedro.com', 'error');
      }
      
      return { user, isAdmin };
    } catch (error) {
      this.log(`Auth check failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Check 2: Test admin function access
  async testAdminFunction() {
    this.log('🔍 Testing admin function access...');
    
    try {
      // Try to call a simple admin function
      const { data, error } = await supabase
        .rpc('is_admin');
        
      if (error) {
        this.log(`Admin function error: ${error.message}`, 'error');
        this.log('This suggests admin policies are not deployed to Supabase', 'warn');
        return false;
      }
      
      this.log(`Admin function result: ${data}`, data ? 'success' : 'warn');
      return data;
    } catch (error) {
      this.log(`Admin function test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Check 3: Test profile access
  async testProfileAccess() {
    this.log('🔍 Testing profile data access...');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, credits')
        .limit(1);
        
      if (error) {
        this.log(`Profile access error: ${error.message}`, 'error');
        if (error.message.includes('permission')) {
          this.log('Permission denied - admin policies may not be active', 'warn');
        }
        return false;
      }
      
      this.log(`Profile access successful - found ${data.length} profiles`, 'success');
      return true;
    } catch (error) {
      this.log(`Profile access test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Check 4: Test payment history access
  async testPaymentAccess() {
    this.log('🔍 Testing payment history access...');
    
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('customer_email, amount, created_at')
        .limit(1);
        
      if (error) {
        this.log(`Payment access error: ${error.message}`, 'error');
        return false;
      }
      
      this.log(`Payment access successful - found ${data.length} payments`, 'success');
      return true;
    } catch (error) {
      this.log(`Payment access test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Main diagnosis
  async runDiagnosis() {
    this.log('🏁 Starting admin panel diagnosis...\n');
    
    const authResult = await this.checkAuth();
    const adminFuncResult = await this.testAdminFunction();
    const profileAccess = await this.testProfileAccess();
    const paymentAccess = await this.testPaymentAccess();
    
    this.log('\n📊 DIAGNOSIS SUMMARY');
    this.log('==================');
    
    if (!authResult) {
      this.log('❌ CRITICAL: User not authenticated', 'error');
      this.log('💡 SOLUTION: Please log in as diogo@diogoppedro.com', 'info');
    } else if (!authResult.isAdmin) {
      this.log('❌ CRITICAL: Current user is not admin', 'error');
      this.log(`💡 SOLUTION: Log in as diogo@diogoppedro.com (currently: ${authResult.user.email})`, 'info');
    } else {
      this.log('✅ Authentication: Admin user logged in', 'success');
    }
    
    if (!adminFuncResult) {
      this.log('❌ CRITICAL: Admin functions not available', 'error');
      this.log('💡 SOLUTION: Deploy admin policies to Supabase (run admin-policies.sql)', 'info');
    } else {
      this.log('✅ Admin Functions: Available and working', 'success');
    }
    
    if (!profileAccess) {
      this.log('❌ ERROR: Cannot access profile data', 'error');
    } else {
      this.log('✅ Profile Access: Working', 'success');
    }
    
    if (!paymentAccess) {
      this.log('⚠️ WARNING: Cannot access payment data', 'warn');
    } else {
      this.log('✅ Payment Access: Working', 'success');
    }
    
    if (this.issues.length > 0) {
      this.log('\n🔧 REQUIRED FIXES:', 'warn');
      this.issues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue}`);
      });
    } else {
      this.log('\n🎉 All checks passed! Admin panel should work.', 'success');
    }
    
    return {
      authenticated: !!authResult,
      isAdmin: authResult?.isAdmin || false,
      adminFunctionsWork: adminFuncResult,
      profileAccess,
      paymentAccess,
      issues: this.issues
    };
  }
}

// Create global debugger
window.adminDebugger = new AdminDebugger();

// Quick fix commands
window.adminFix = {
  diagnose: () => window.adminDebugger.runDiagnosis(),
  checkAuth: () => window.adminDebugger.checkAuth(),
  testFunctions: () => window.adminDebugger.testAdminFunction(),
};

console.log(`
🔧 ADMIN DEBUGGER LOADED!

Commands:
- adminFix.diagnose()     // Full diagnosis
- adminFix.checkAuth()    // Check authentication
- adminFix.testFunctions() // Test admin functions

Running auto-diagnosis...
`);

// Auto-run diagnosis
window.adminDebugger.runDiagnosis();