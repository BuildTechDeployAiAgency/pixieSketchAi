#!/bin/bash

# PixieSketch Edge Functions Deployment Script
# This script deploys all Edge Functions using npx (no Supabase CLI installation required)

echo "🚀 Starting Edge Functions Deployment for PixieSketch"
echo "=================================================="

# Check if we're in the right directory
if [ ! -d "supabase/functions" ]; then
    echo "❌ Error: supabase/functions directory not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📋 This will deploy the following Edge Functions:"
echo "  1. admin-operations (Admin dashboard)"
echo "  2. analyze-drawing (AI analysis)"
echo "  3. process-sketch (AI transformation)"
echo "  4. create-payment (Stripe checkout)"
echo "  5. send-email (Email notifications)"
echo "  6. stripe-webhook (Payment webhooks)"
echo "  7. verify-payment (Payment verification)"
echo ""

# Login to Supabase
echo "🔐 Step 1: Login to Supabase"
echo "A browser window will open for authentication..."
npx supabase login

# Link to the project
echo ""
echo "🔗 Step 2: Linking to your Supabase project"
npx supabase link --project-ref uihnpebacpcndtkdizxd

# Deploy each function
echo ""
echo "📦 Step 3: Deploying Edge Functions"
echo "This may take a few minutes..."

functions=(
    "admin-operations"
    "analyze-drawing"
    "process-sketch"
    "create-payment"
    "send-email"
    "stripe-webhook"
    "verify-payment"
)

for func in "${functions[@]}"; do
    echo ""
    echo "Deploying $func..."
    if npx supabase functions deploy "$func" --no-verify-jwt; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ Failed to deploy $func"
        echo "Continuing with other functions..."
    fi
done

echo ""
echo "🔑 Step 4: Setting up environment variables"
echo "You need to set the following secrets in Supabase Dashboard:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/uihnpebacpcndtkdizxd/settings/vault"
echo "2. Add these secrets:"
echo "   - OPENAI_API_KEY (for AI transformations)"
echo "   - STRIPE_SECRET_KEY (for payments)"
echo "   - STRIPE_WEBHOOK_SECRET (for webhooks)"
echo "   - RESEND_API_KEY (for emails)"
echo ""
echo "Or run these commands:"
echo "  npx supabase secrets set OPENAI_API_KEY=your-key"
echo "  npx supabase secrets set STRIPE_SECRET_KEY=your-key"
echo "  npx supabase secrets set STRIPE_WEBHOOK_SECRET=your-key"
echo "  npx supabase secrets set RESEND_API_KEY=your-key"

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set your API keys as secrets (see above)"
echo "2. Test the admin dashboard at http://localhost:8080/admin"
echo "3. Verify functions are working with the health check"
echo ""
echo "To check deployment status:"
echo "  npx supabase functions list"
echo ""
echo "To view logs:"
echo "  npx supabase functions logs admin-operations --tail"