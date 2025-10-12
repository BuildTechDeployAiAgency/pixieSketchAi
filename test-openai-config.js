// Test script to verify OpenAI API configuration
// Run with: node test-openai-config.js

const https = require('https');

// Test OpenAI API key validity
async function testOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    return false;
  }
  
  if (apiKey.length < 10) {
    console.error('❌ OPENAI_API_KEY appears to be invalid (too short)');
    return false;
  }
  
  console.log('✅ OpenAI API key is present and appears valid');
  
  // Test a simple API call to verify the key works
  const testData = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: "Hello, this is a test to verify the API key works."
      }
    ],
    max_tokens: 10
  };
  
  return new Promise((resolve) => {
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ OpenAI API key is working correctly');
          console.log('Response:', JSON.parse(data).choices[0].message.content);
          resolve(true);
        } else if (res.statusCode === 401) {
          console.error('❌ OpenAI API key is invalid or expired');
          console.error('Response:', data);
          resolve(false);
        } else {
          console.error(`❌ OpenAI API returned status ${res.statusCode}`);
          console.error('Response:', data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error making request to OpenAI API:', error.message);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Check Supabase configuration
function checkSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL environment variable is not set');
    return false;
  }
  
  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    return false;
  }
  
  console.log('✅ Supabase configuration is present');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 10)}...`);
  
  return true;
}

// Main test function
async function runTests() {
  console.log('🔍 Testing PixieSketch AI Configuration...\n');
  
  console.log('1. Checking OpenAI API Configuration:');
  const openAIResult = await testOpenAIConfig();
  console.log('');
  
  console.log('2. Checking Supabase Configuration:');
  const supabaseResult = checkSupabaseConfig();
  console.log('');
  
  if (openAIResult && supabaseResult) {
    console.log('🎉 All configurations are valid! The application should work correctly.');
  } else {
    console.log('❌ Some configuration issues were found. Please fix them before testing the application.');
  }
}

// Run the tests
runTests().catch(console.error);