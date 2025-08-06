#!/bin/bash

# PixieSketch Edge Functions Deployment Script
# Run this script after making CORS security updates

set -e

echo "🚀 Deploying PixieSketch Edge Functions with Security Updates"
echo "============================================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   macOS: brew install supabase/tap/supabase"
    echo "   npm: npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run: supabase login"
    exit 1
fi

echo "✅ Supabase CLI found and authenticated"

# Deploy functions with enhanced CORS security
functions=("analyze-drawing" "process-sketch" "create-payment" "admin-operations")

for func in "${functions[@]}"; do
    echo ""
    echo "📦 Deploying $func..."
    if supabase functions deploy "$func" --no-verify-jwt; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ Failed to deploy $func"
        exit 1
    fi
done

echo ""
echo "🎉 All Edge Functions deployed successfully!"
echo ""
echo "🧪 Next Steps:"
echo "1. Test CORS by opening test-cors.html in your browser from:"
echo "   - https://pixie-sketch-ai.vercel.app"
echo "   - http://localhost:8080 (during development)"
echo ""
echo "2. Verify the application works correctly:"
echo "   - Upload a drawing"
echo "   - Test AI transformation"
echo "   - Check payment flow"
echo "   - Test admin operations"
echo ""
echo "🔒 Security Note:"
echo "The updated CORS configuration now only allows requests from:"
echo "- http://localhost:8080 (development)"
echo "- https://pixie-sketch-ai.vercel.app (production)"
echo "- https://pixiesketch.com (if you use this domain)"