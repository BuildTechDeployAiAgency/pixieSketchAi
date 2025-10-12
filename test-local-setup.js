// Comprehensive test script for PixieSketch AI local development
// Run with: node test-local-setup.js

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing PixieSketch AI Local Setup...\n');

// Test 1: Check if required files exist
console.log('1. Checking required files...');
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  '.env.local',
  'src/App.tsx',
  'src/main.tsx',
  'supabase/functions/process-sketch/index.ts',
  'supabase/functions/process-sketch/openai-service.ts'
];

let filesOk = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - Missing!`);
    filesOk = false;
  }
});

if (!filesOk) {
  console.log('\n❌ Some required files are missing. Please check the installation.');
  process.exit(1);
}

// Test 2: Check environment variables
console.log('\n2. Checking environment variables...');
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const envVars = envContent.split('\n');
  
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY'
  ];
  
  requiredEnvVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      console.log(`   ✅ ${varName} is set`);
    } else {
      console.log(`   ❌ ${varName} is missing`);
    }
  });
} catch (error) {
  console.log('   ❌ Could not read .env.local file');
}

// Test 3: Check if node_modules exists
console.log('\n3. Checking dependencies...');
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('   ✅ node_modules directory exists');
} else {
  console.log('   ❌ node_modules directory missing');
  console.log('   💡 Run: npm install');
}

// Test 4: Check if project is on correct Git branch
console.log('\n4. Checking Git status...');
try {
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`   ✅ Current branch: ${currentBranch}`);
  
  if (currentBranch === 'fix/image-generation-errors') {
    console.log('   ✅ On correct branch for fixes');
  } else if (currentBranch === 'main') {
    console.log('   ⚠️  On main branch - consider switching to feature branch');
  }
} catch (error) {
  console.log('   ⚠️  Could not check Git status');
}

// Test 5: Instructions for testing
console.log('\n5. Testing Instructions:');
console.log('   To start the development server, run:');
console.log('   npm run dev');
console.log('');
console.log('   To test the image generation:');
console.log('   1. Start the dev server');
console.log('   2. Open http://localhost:8080 in your browser');
console.log('   3. Sign in with Google');
console.log('   4. Upload a test image');
console.log('   5. Select a transformation style');
console.log('   6. Check the browser console for errors');
console.log('   7. Check Supabase Edge Function logs');
console.log('');
console.log('   To check Supabase Edge Function logs:');
console.log('   1. Go to https://supabase.com/dashboard');
console.log('   2. Select your project');
console.log('   3. Go to Edge Functions');
console.log('   4. Click on process-sketch function');
console.log('   5. View logs');
console.log('');
console.log('   Common issues to check:');
console.log('   - OpenAI API key in Supabase Edge Function secrets');
console.log('   - CORS configuration in supabase/functions/_shared/cors.ts');
console.log('   - Storage bucket permissions');
console.log('   - Credit system functionality');

console.log('\n🎉 Local setup check complete!');