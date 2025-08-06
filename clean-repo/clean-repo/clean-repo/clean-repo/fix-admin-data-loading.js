// Fix Admin Data Loading Issues
// Run this in browser console to diagnose and fix data loading

console.log('🔧 ADMIN DATA LOADING FIXER');
console.log('===========================');

class AdminDataFixer {
  constructor() {
    this.issues = [];
    this.supabase = null;
  }

  // Get Supabase client from various possible sources
  getSupabaseClient() {
    // Try different ways to access Supabase
    if (window.supabase) {
      return window.supabase;
    }
    
    // Try to get from React app context
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const reactInstances = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers;
      if (reactInstances && reactInstances.size > 0) {
        // This is a fallback - React DevTools might have the instance
        console.log('React DevTools detected, but Supabase access limited');
      }
    }
    
    // Try to access from the app's global variables
    if (window.app && window.app.supabase) {
      return window.app.supabase;
    }
    
    // Try to get from any global variable that might contain it
    for (const key in window) {
      if (key.toLowerCase().includes('supabase') && window[key] && window[key].from) {
        return window[key];
      }
    }
    
    return null;
  }

  log(message, type = 'info') {
    const prefix = {
      'error': '❌',
      'warn': '⚠️', 
      'success': '✅',
      'info': 'ℹ️'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} ${message}`);
  }

  // Test 1: Check if admin policies are deployed
  async testAdminPolicies() {
    this.log('🔍 Testing admin policies...');
    
    this.supabase = this.getSupabaseClient();
    if (!this.supabase) {
      this.log('❌ Supabase client not found!', 'error');
      this.log('💡 Make sure you are on the app page and Supabase is loaded', 'warn');
      return false;
    }
    
    try {
      // Test if is_admin function exists
      const { data, error } = await this.supabase.rpc('is_admin');
      
      if (error) {
        this.log(`Admin function error: ${error.message}`, 'error');
        this.log('🚨 CRITICAL: Admin policies are NOT deployed!', 'error');
        return false;
      }
      
      this.log(`Admin function works. User is admin: ${data}`, data ? 'success' : 'warn');
      return data;
    } catch (error) {
      this.log(`Admin policies test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Test 2: Check direct table access
  async testDirectAccess() {
    this.log('🔍 Testing direct table access...');
    
    if (!this.supabase) {
      this.supabase = this.getSupabaseClient();
      if (!this.supabase) {
        this.log('❌ Supabase client not available', 'error');
        return null;
      }
    }
    
    try {
      // Try to access profiles directly
      const { data: profiles, error: profileError } = await this.supabase
        .from('profiles')
        .select('id, email, credits')
        .limit(5);
      
      if (profileError) {
        this.log(`Profiles access error: ${profileError.message}`, 'error');
      } else {
        this.log(`✅ Profiles access: Found ${profiles.length} users`, 'success');
        if (profiles.length > 0) {
          this.log(`Sample user: ${profiles[0].email} (${profiles[0].credits} credits)`, 'info');
        }
      }

      // Try to access payment_history directly
      const { data: payments, error: paymentError } = await this.supabase
        .from('payment_history')
        .select('id, customer_email, amount, payment_status')
        .limit(5);
      
      if (paymentError) {
        this.log(`Payment history access error: ${paymentError.message}`, 'error');
      } else {
        this.log(`✅ Payment history access: Found ${payments.length} payments`, 'success');
        if (payments.length > 0) {
          this.log(`Sample payment: ${payments[0].customer_email} - $${payments[0].amount/100}`, 'info');
        }
      }

      return {
        profiles: profiles || [],
        payments: payments || [],
        profileAccess: !profileError,
        paymentAccess: !paymentError
      };
    } catch (error) {
      this.log(`Direct access test failed: ${error.message}`, 'error');
      return null;
    }
  }

  // Test 3: Calculate stats manually
  async calculateStats(profiles, payments) {
    this.log('🔍 Calculating stats manually...');
    
    try {
      const totalUsers = profiles.length;
      const totalCredits = profiles.reduce((sum, user) => sum + (user.credits || 0), 0);
      const completedPayments = payments.filter(p => p.payment_status === 'completed');
      const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
      
      this.log(`📊 Manual Stats:`, 'info');
      this.log(`   Total Users: ${totalUsers}`, 'info');
      this.log(`   Total Credits: ${totalCredits}`, 'info');
      this.log(`   Total Revenue: $${totalRevenue.toFixed(2)}`, 'info');
      this.log(`   Successful Payments: ${completedPayments.length}`, 'info');
      
      return {
        totalUsers,
        totalCredits,
        totalRevenue,
        successfulPayments: completedPayments.length
      };
    } catch (error) {
      this.log(`Stats calculation failed: ${error.message}`, 'error');
      return null;
    }
  }

  // Fix 1: Force refresh admin data
  async forceRefreshData() {
    this.log('🔄 Force refreshing admin data...');
    
    // Trigger a page refresh of the admin dashboard
    if (window.location.pathname === '/admin') {
      this.log('Refreshing admin dashboard...', 'info');
      window.location.reload();
    } else {
      this.log('Navigate to /admin first, then run this', 'warn');
    }
  }

  // Fix 2: Provide SQL to deploy admin policies
  showAdminPoliciesSQL() {
    this.log('📝 Admin Policies SQL (Run in Supabase SQL Editor):', 'info');
    
    console.log(`
-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR:

-- Create admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT email FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'diogo@diogoppedro.com'
  ) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Create admin policies for profiles
CREATE POLICY "Admin can read all profiles" 
ON profiles FOR SELECT 
USING (is_admin());

-- Create admin policies for payment_history  
CREATE POLICY "Admin can read all payment history" 
ON payment_history FOR SELECT 
USING (is_admin());

-- Test the function
SELECT is_admin();
    `);
  }

  // Main diagnosis and fix
  async diagnoseAndFix() {
    this.log('🏁 Starting admin data diagnosis...\n');
    
    // First check if Supabase is available
    this.supabase = this.getSupabaseClient();
    if (!this.supabase) {
      this.log('❌ Supabase client not found!', 'error');
      this.log('💡 Make sure you are on the app page (not just the console)', 'warn');
      this.log('💡 Try navigating to the app first, then run this script', 'warn');
      return;
    }
    
    this.log('✅ Supabase client found!', 'success');
    
    // Test admin policies
    const adminWorks = await this.testAdminPolicies();
    
    if (!adminWorks) {
      this.log('\n🚨 SOLUTION: Deploy admin policies!', 'error');
      this.showAdminPoliciesSQL();
      return;
    }
    
    // Test direct access
    const accessResult = await this.testDirectAccess();
    
    if (!accessResult) {
      this.log('\n🚨 Database access completely failed', 'error');
      return;
    }
    
    // Calculate stats manually
    const stats = await this.calculateStats(accessResult.profiles, accessResult.payments);
    
    if (stats && (stats.totalUsers > 0 || stats.successfulPayments > 0)) {
      this.log('\n✅ Data exists! Issue might be with dashboard loading.', 'success');
      this.log('💡 Try refreshing the page or check browser console for errors.', 'info');
    } else {
      this.log('\n⚠️ No data found in database.', 'warn');
      this.log('💡 This might be expected if no users have signed up or made payments yet.', 'info');
    }
    
    return {
      adminWorks,
      accessResult,
      stats
    };
  }
}

// Create global fixer
window.adminFixer = new AdminDataFixer();

// Quick commands
window.adminQuickFix = {
  diagnose: () => adminFixer.diagnoseAndFix(),
  testPolicies: () => adminFixer.testAdminPolicies(),
  testAccess: () => adminFixer.testDirectAccess(),
  refresh: () => adminFixer.forceRefreshData(),
  showSQL: () => adminFixer.showAdminPoliciesSQL()
};

console.log(`
🔧 ADMIN DATA FIXER LOADED!

Quick Commands:
- adminQuickFix.diagnose()    // Full diagnosis
- adminQuickFix.testPolicies() // Test admin functions
- adminQuickFix.testAccess()   // Test data access
- adminQuickFix.showSQL()      // Show SQL to deploy
- adminQuickFix.refresh()      // Refresh dashboard

IMPORTANT: Make sure you are on the app page first!
`);

// Auto-run diagnosis
adminFixer.diagnoseAndFix();