#!/bin/bash

# Fix Production CORS Issues Script
# This updates all Edge Functions with your production domain

echo "🔧 Fixing Production CORS Issues"
echo "================================"

# Ask for production domain
echo ""
echo "What is your production domain? (e.g., pixiesketch.vercel.app, pixiesketch.com)"
echo "Enter the domain WITHOUT https:// prefix:"
read -p "Domain: " PROD_DOMAIN

if [ -z "$PROD_DOMAIN" ]; then
    echo "❌ No domain provided. Exiting."
    exit 1
fi

PROD_URL="https://$PROD_DOMAIN"
echo "✅ Will add: $PROD_URL to allowed origins"

# Function to update allowed origins
update_function() {
    local file=$1
    echo "Updating $file..."
    
    # Check if the domain already exists
    if grep -q "$PROD_URL" "$file"; then
        echo "  ✅ Already has $PROD_URL"
    else
        # Add the production URL to allowedOrigins array
        sed -i.bak "/const allowedOrigins = \[/,/\];/ s/'https:\/\/pixiesketch.com'/'https:\/\/pixiesketch.com',\\
  '$PROD_URL'/" "$file"
        echo "  ✅ Added $PROD_URL"
    fi
}

# Update all Edge Functions
echo ""
echo "📝 Updating Edge Functions..."

FUNCTIONS=(
    "admin-operations"
    "analyze-drawing"
    "create-payment"
    "process-sketch"
    "send-email"
    "stripe-webhook"
    "verify-payment"
)

for func in "${FUNCTIONS[@]}"; do
    file="supabase/functions/$func/index.ts"
    if [ -f "$file" ]; then
        update_function "$file"
    else
        echo "  ⚠️  $file not found"
    fi
done

# Clean up backup files
rm -f supabase/functions/*/*.bak

echo ""
echo "✅ All Edge Functions updated!"
echo ""
echo "📋 Next Steps:"
echo "1. Review the changes: git diff"
echo "2. Commit changes: git add -A && git commit -m 'fix: Add $PROD_DOMAIN to CORS allowed origins'"
echo "3. Push to GitHub: git push"
echo "4. Redeploy Edge Functions:"
echo "   ./deploy-edge-functions.sh"
echo ""
echo "5. For Vercel deployment, ensure these environment variables are set:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - VITE_STRIPE_PUBLISHABLE_KEY"
echo ""
echo "🔍 To debug further:"
echo "   npx supabase functions logs create-payment --tail"
echo "   npx supabase functions logs admin-operations --tail"