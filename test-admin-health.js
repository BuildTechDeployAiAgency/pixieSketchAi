// Test script for admin-operations Edge Function health check
// Run this in the browser console while logged in as admin

async function testAdminHealth() {
  console.log('🏥 Testing Admin Operations Health Check...');
  
  try {
    // Get the current auth token
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.error('❌ Not logged in! Please log in first.');
      return;
    }
    
    console.log('👤 Logged in as:', session.data.session.user.email);
    
    // Test the health endpoint
    console.log('📡 Calling admin-operations health check...');
    const { data, error } = await supabase.functions.invoke('admin-operations', {
      body: {
        operation: 'health'
      }
    });
    
    if (error) {
      console.error('❌ Health check failed:', error);
      console.error('Error details:', {
        message: error.message,
        context: error.context,
        status: error.status
      });
    } else {
      console.log('✅ Health check successful:', data);
    }
    
    // Test admin access
    console.log('\n🔐 Testing admin access...');
    const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
    
    if (isAdminError) {
      console.error('❌ Admin check failed:', isAdminError);
    } else {
      console.log('✅ Is admin:', isAdminData);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testAdminHealth();

// Export for manual use
window.testAdminHealth = testAdminHealth;

console.log(`
🧪 Admin Health Check Ready!

To run the test again:
testAdminHealth()

Make sure you're logged in as the admin user (diogo@diogoppedro.com)
`);