#!/bin/bash

# Edge Functions Deployment Verification Script
# This script checks if all Edge Functions are properly deployed

set -e

echo "🔍 Verifying Edge Functions Deployment"
echo "====================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    exit 1
fi

# List all deployed functions
echo ""
echo "📋 Listing deployed Edge Functions..."
supabase functions list

# Functions to verify
functions=("analyze-drawing" "process-sketch" "create-payment" "admin-operations" "stripe-webhook" "send-email" "verify-payment")

echo ""
echo "🧪 Checking function deployment status..."
echo ""

for func in "${functions[@]}"; do
    echo -n "Checking $func... "
    
    # Try to get function details
    if supabase functions list | grep -q "$func"; then
        echo "✅ Deployed"
    else
        echo "❌ NOT DEPLOYED"
    fi
done

echo ""
echo "📝 Deployment Instructions:"
echo ""
echo "To deploy missing functions, run:"
echo "  supabase functions deploy <function-name> --no-verify-jwt"
echo ""
echo "To deploy all functions at once, run:"
echo "  ./deploy-functions.sh"
echo ""
echo "To check function logs:"
echo "  supabase functions logs <function-name>"
echo ""
echo "To test admin-operations health check:"
echo "  Open your browser console and run the contents of test-admin-health.js"