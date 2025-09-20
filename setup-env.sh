#!/bin/bash

echo "🚀 Setting up Truleado environment variables..."

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration (for website analysis and subreddit discovery)
OPENAI_API_KEY=your_openai_api_key_here

# Paddle Configuration (for payments)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token_here
PADDLE_VENDOR_ID=your_paddle_vendor_id_here
PADDLE_API_KEY=your_paddle_api_key_here
PADDLE_PRODUCT_ID=your_paddle_product_id_here
PADDLE_PRICE_ID=your_paddle_price_id_here
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret_here

# Reddit API Configuration (optional)
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here

# Google OAuth Configuration (for Google sign-in)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
EOF
  echo "✅ Created .env.local file"
else
  echo "ℹ️  .env.local already exists. Skipping creation."
fi

echo ""
echo "📝 Next steps:"
echo "1. Update Supabase credentials in .env.local"
echo "2. Get OpenAI API key from https://platform.openai.com/api-keys"
echo "3. Update OpenAI API key in .env.local for website analysis"
echo "4. Set up Reddit API credentials for lead discovery:"
echo "   - Go to https://www.reddit.com/prefs/apps"
echo "   - Create a new app (script type)"
echo "   - Add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET to .env.local"
echo "5. Add Supabase service role key for background jobs:"
echo "   - Get from Supabase Dashboard > Settings > API"
echo "   - Add SUPABASE_SERVICE_ROLE_KEY to .env.local"
echo "6. Set up Google OAuth for Google sign-in:"
echo "   - Go to https://console.cloud.google.com/"
echo "   - Create a new project or select existing one"
echo "   - Enable Google+ API"
echo "   - Create OAuth 2.0 credentials"
echo "   - Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET to .env.local"
echo "7. Set up Paddle credentials:"
echo "   - Go to https://vendors.paddle.com/ (or sandbox)"
echo "   - Get your Vendor ID, API Key, Product ID, Price ID"
echo "   - Set up webhook endpoint: https://yourdomain.com/api/billing/webhook"
echo "   - Get webhook secret from Paddle dashboard"
echo "   - Add all Paddle variables to .env.local"
echo ""
echo "🔗 Supabase Setup Guide: ./SUPABASE_SETUP.md"
echo ""
echo "⚠️  Remember to never commit .env.local to version control!"
echo ""
echo "🎯 To test lead discovery:"
echo "1. Run the database migration: migration-leads-system.sql"
echo "2. Add Reddit API credentials to .env.local"
echo "3. Restart your dev server: npm run dev"
echo "4. Go to Leads page and click 'Start' on a product"
echo "5. Check the terminal for lead discovery logs"