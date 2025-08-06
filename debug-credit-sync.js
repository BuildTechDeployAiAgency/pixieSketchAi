// Emergency Credit Sync Debugger
// Run this in browser console to diagnose the 489 credits issue

console.log('🚨 CREDIT SYNC DEBUGGER LOADED');
console.log('===============================');

class CreditSyncDebugger {
  constructor() {
    this.issues = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'error': '❌',
      'warn': '⚠️',
      'success': '✅',
      'info': 'ℹ️'
    }[type] || 'ℹ️';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
    
    if (type === 'error' || type === 'warn') {
      this.issues.push({ timestamp, type, message });
    }
  }

  // Check 1: Current frontend credit display
  checkFrontendCredits() {
    this.log('🔍 Checking frontend credit display...');
    
    const headerText = document.querySelector('header')?.textContent || '';
    const creditMatch = headerText.match(/(\d+)\s+Credits?/i);
    
    if (creditMatch) {
      const displayedCredits = parseInt(creditMatch[1]);
      this.log(`Frontend shows: ${displayedCredits} credits`, 
        displayedCredits === 489 ? 'warn' : 'info');
      
      if (displayedCredits === 489) {
        this.log('Found the issue: Frontend showing 489 credits instead of 0', 'error');
      }
      
      return displayedCredits;
    } else {
      this.log('Could not find credit display in UI', 'error');
      return null;
    }
  }

  // Check 2: React component state
  checkReactState() {
    this.log('🔍 Checking React component state...');
    
    // Try to find React fiber and check state
    const rootElement = document.querySelector('#root');
    if (rootElement && rootElement._reactInternalFiber) {
      this.log('React fiber found - checking for profile state', 'info');
      // This is a simplified check - real inspection would be more complex
    } else {
      this.log('React internal state not accessible via simple inspection', 'warn');
    }
    
    // Check localStorage for cached values
    const cachedAuth = localStorage.getItem('isAuthenticated');
    const supabaseSession = localStorage.getItem('supabase.auth.token');
    
    this.log(`localStorage cached auth: ${cachedAuth}`, 'info');
    this.log(`Supabase session exists: ${!!supabaseSession}`, 'info');
  }

  // Check 3: Supabase connection
  async checkSupabaseConnection() {
    this.log('🔍 Checking Supabase connection...');
    
    try {
      // Try to access global supabase client
      if (typeof supabase !== 'undefined') {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          this.log(`Supabase auth error: ${error.message}`, 'error');
          return false;
        }
        
        if (user) {
          this.log(`Authenticated as: ${user.email}`, 'success');
          
          // Try to fetch fresh profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits, updated_at')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            this.log(`Profile fetch error: ${profileError.message}`, 'error');
            return false;
          }
          
          if (profile) {
            this.log(`Database credits: ${profile.credits}`, 
              profile.credits === 489 ? 'warn' : 'success');
            this.log(`Last updated: ${profile.updated_at}`, 'info');
            
            return profile;
          }
        } else {
          this.log('No authenticated user found', 'error');
          return false;
        }
      } else {
        this.log('Supabase client not available globally', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Supabase connection error: ${error.message}`, 'error');
      return false;
    }
  }

  // Check 4: Real-time subscription status
  checkRealtimeStatus() {
    this.log('🔍 Checking real-time subscription status...');
    
    // Check if there are any active channels
    if (typeof supabase !== 'undefined' && supabase.getChannels) {
      const channels = supabase.getChannels();
      this.log(`Active Supabase channels: ${channels.length}`, 'info');
      
      channels.forEach((channel, index) => {
        this.log(`Channel ${index}: ${channel.topic} (${channel.state})`, 'info');
      });
    } else {
      this.log('Cannot check Supabase channels', 'warn');
    }
  }

  // Fix 1: Force profile refresh
  async forceProfileRefresh() {
    this.log('🔧 Attempting to force profile refresh...');
    
    try {
      if (typeof supabase !== 'undefined') {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Force a fresh fetch from database
          const { data: freshProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) {
            this.log(`Failed to fetch fresh profile: ${error.message}`, 'error');
            return false;
          }
          
          this.log(`Fresh profile data:`, 'info');
          console.table(freshProfile);
          
          // Try to trigger a profile update event manually
          window.dispatchEvent(new CustomEvent('profile-refresh', { 
            detail: freshProfile 
          }));
          
          return freshProfile;
        }
      }
    } catch (error) {
      this.log(`Profile refresh failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Fix 2: Clear all caches
  clearAllCaches() {
    this.log('🔧 Clearing all caches...');
    
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage);
    this.log(`Clearing ${localStorageKeys.length} localStorage items`, 'info');
    localStorage.clear();
    
    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    this.log(`Clearing ${sessionStorageKeys.length} sessionStorage items`, 'info');
    sessionStorage.clear();
    
    this.log('Cache clearing complete - page refresh recommended', 'success');
  }

  // Fix 3: Force database credit reset
  async forceDatabaseReset() {
    this.log('🔧 Attempting to force database credit reset...');
    
    try {
      if (typeof supabase !== 'undefined') {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ 
              credits: 0, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', user.id);
          
          if (error) {
            this.log(`Database reset failed: ${error.message}`, 'error');
            return false;
          }
          
          this.log('Database credit reset successful', 'success');
          
          // Verify the reset
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('credits, updated_at')
            .eq('id', user.id)
            .single();
          
          this.log(`Verified credits now: ${updatedProfile.credits}`, 
            updatedProfile.credits === 0 ? 'success' : 'error');
          
          return updatedProfile;
        }
      }
    } catch (error) {
      this.log(`Database reset error: ${error.message}`, 'error');
      return false;
    }
  }

  // Generate comprehensive report
  generateReport() {
    this.log('\n📊 CREDIT SYNC DIAGNOSTIC REPORT', 'info');
    this.log('================================', 'info');
    
    const duration = (Date.now() - this.startTime) / 1000;
    this.log(`Diagnosis completed in ${duration.toFixed(2)}s`, 'info');
    
    if (this.issues.length > 0) {
      this.log(`\n🚨 ISSUES FOUND (${this.issues.length}):`, 'error');
      this.issues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue.message}`, issue.type);
      });
    } else {
      this.log('✅ No critical issues detected', 'success');
    }
    
    this.log('\n🔧 RECOMMENDED ACTIONS:', 'info');
    this.log('1. Run debugger.forceDatabaseReset()', 'info');
    this.log('2. Run debugger.clearAllCaches()', 'info');
    this.log('3. Refresh browser page', 'info');
    this.log('4. Verify credits show 0 in UI', 'info');
  }

  // Main diagnostic runner
  async runFullDiagnosis() {
    this.log('🏁 Starting full credit sync diagnosis...', 'info');
    
    // Run all checks
    const frontendCredits = this.checkFrontendCredits();
    this.checkReactState();
    const dbProfile = await this.checkSupabaseConnection();
    this.checkRealtimeStatus();
    
    // Compare results
    if (frontendCredits && dbProfile) {
      if (frontendCredits !== dbProfile.credits) {
        this.log(`SYNC MISMATCH: Frontend(${frontendCredits}) != Database(${dbProfile.credits})`, 'error');
      } else {
        this.log(`Credits in sync: ${frontendCredits}`, 'success');
      }
    }
    
    this.generateReport();
    
    return {
      frontendCredits,
      databaseCredits: dbProfile?.credits,
      inSync: frontendCredits === dbProfile?.credits,
      issues: this.issues
    };
  }
}

// Create global debugger instance
window.creditDebugger = new CreditSyncDebugger();

// Quick fix commands
window.creditFix = {
  diagnose: () => creditDebugger.runFullDiagnosis(),
  resetDB: () => creditDebugger.forceDatabaseReset(),
  clearCache: () => creditDebugger.clearAllCaches(),
  refresh: () => creditDebugger.forceProfileRefresh(),
  report: () => creditDebugger.generateReport()
};

// Auto-run diagnosis
console.log(`
🚨 CREDIT SYNC DEBUGGER READY!

Quick Commands:
- creditFix.diagnose()  // Full diagnosis
- creditFix.resetDB()   // Force database reset to 0
- creditFix.clearCache() // Clear all caches
- creditFix.refresh()   // Force profile refresh
- creditFix.report()    // Generate report

Running auto-diagnosis now...
`);

// Run diagnosis automatically
creditDebugger.runFullDiagnosis();