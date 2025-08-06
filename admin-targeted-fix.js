// Targeted Admin Fix - Run in browser console
// This will identify and fix the specific admin data loading issue

console.log('🎯 TARGETED ADMIN FIX');
console.log('====================');

async function targetedAdminFix() {
  
  // Step 1: Test authentication
  console.log('🔍 Step 1: Testing authentication...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.log('❌ Not authenticated');
      return;
    }
    console.log('✅ Authenticated as:', user.email);
    console.log('✅ Is admin email:', user.email === 'diogo@diogoppedro.com');
  } catch (error) {
    console.log('❌ Auth error:', error.message);
    return;
  }

  // Step 2: Test admin function
  console.log('\n🔍 Step 2: Testing admin function...');
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.log('❌ Admin function error:', error.message);
      console.log('💡 Try this SQL in Supabase:');
      console.log('SELECT is_admin();');
      return;
    }
    console.log('✅ Admin function works, result:', data);
  } catch (error) {
    console.log('❌ Admin function failed:', error.message);
    return;
  }

  // Step 3: Test direct data access
  console.log('\n🔍 Step 3: Testing direct data access...');
  
  // Test profiles
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, credits, created_at')
      .limit(10);
    
    if (error) {
      console.log('❌ Profiles error:', error.message);
      console.log('💡 This suggests RLS policy conflicts');
    } else {
      console.log('✅ Profiles access successful');
      console.log(`📊 Found ${profiles.length} users`);
      if (profiles.length > 0) {
        console.log('👤 Sample users:');
        profiles.slice(0, 3).forEach(user => {
          console.log(`   ${user.email}: ${user.credits} credits`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Profiles access failed:', error.message);
  }

  // Test payment_history
  try {
    const { data: payments, error } = await supabase
      .from('payment_history')
      .select('id, customer_email, amount, payment_status, created_at')
      .limit(10);
    
    if (error) {
      console.log('❌ Payment history error:', error.message);
    } else {
      console.log('✅ Payment history access successful');
      console.log(`💳 Found ${payments.length} payments`);
      if (payments.length > 0) {
        console.log('💰 Sample payments:');
        payments.slice(0, 3).forEach(payment => {
          console.log(`   ${payment.customer_email}: $${payment.amount/100} (${payment.payment_status})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Payment history access failed:', error.message);
  }

  // Step 4: Check for policy conflicts
  console.log('\n🔍 Step 4: Checking for policy conflicts...');
  console.log('Run this SQL in Supabase to see all policies:');
  console.log(`
-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'payment_history')
ORDER BY tablename, policyname;
  `);

  // Step 5: Provide fix
  console.log('\n🔧 Step 5: Potential fixes...');
  console.log('If you see policy conflicts, run this SQL to fix:');
  console.log(`
-- Drop conflicting policies (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate admin policies
CREATE POLICY "Admin can read all profiles" 
ON profiles FOR SELECT 
USING (is_admin());

CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id OR is_admin())
WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Similar for payment_history
CREATE POLICY "Admin can read all payment history" 
ON payment_history FOR SELECT 
USING (is_admin());

CREATE POLICY "Users can view own payment history" 
ON payment_history FOR SELECT 
USING (
  auth.uid() = user_id OR 
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  is_admin()
);
  `);

  console.log('\n🎯 SUMMARY:');
  console.log('1. Check if admin function works above');
  console.log('2. Look for data access errors');
  console.log('3. If policies conflict, run the fix SQL');
  console.log('4. Refresh the admin page');
}

// Run the targeted fix
targetedAdminFix();