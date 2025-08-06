import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://uihnpebacpcndtkdizxd.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.log('\nTo fix this issue:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to Settings > API');
  console.log('3. Copy the service_role key (keep it secret!)');
  console.log('4. Run: export SUPABASE_SERVICE_KEY="your-service-key"');
  console.log('5. Then run this script again');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  try {
    console.log('🚀 Setting up Supabase storage...');

    // Create the sketches bucket
    const { data, error } = await supabase.storage.createBucket('sketches', {
      public: true,
      fileSizeLimit: 52428800, // 50MB in bytes
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Storage bucket "sketches" already exists');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Created storage bucket "sketches"');
    }

    // Test bucket access
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log('📦 Available buckets:', buckets?.map(b => b.name).join(', '));

    console.log('\n✨ Storage setup complete!');
    console.log('\nNote: If uploads still fail, check:');
    console.log('1. RLS policies are properly configured');
    console.log('2. Users have INSERT permissions on the storage.objects table');
    console.log('3. The bucket allows public uploads or authenticated users');

  } catch (error) {
    console.error('❌ Error setting up storage:', error);
    process.exit(1);
  }
}

setupStorage();