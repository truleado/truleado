#!/bin/bash

# Development Environment Setup Script
echo "Setting up development environment..."

# Backup existing .env.local
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "Backed up existing .env.local"
fi

# Create development .env.local
cat > .env.local << 'EOF'
# Development Environment Configuration
NODE_ENV=development

# Supabase Configuration (with fallbacks for localhost)
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key
SUPABASE_SERVICE_ROLE_KEY=placeholder_service_key

# OpenAI Configuration (with fallback)
OPENAI_API_KEY=placeholder_openai_key

# Email Configuration (with fallback)
RESEND_API_KEY=placeholder_resend_key

# Paddle Configuration (existing values)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_0bf1964f1956cf8b8016c622a74
NEXT_PUBLIC_PADDLE_PRICE_ID=pri_01k5pevshnn2pyj60ek1cva82b
PADDLE_API_KEY=pdl_sdbx_apikey_01k5pg78as0jmagj9707v0x11m_GSCD7X3rg3Nr792GpHJNv1_A55
PADDLE_PRICE_ID=pri_01k5pevshnn2pyj60ek1cva82b
PADDLE_WEBHOOK_SECRET=pdl_ntfset_01k5pfccbhf0q55agk73v33yge_CX5J+2ngGn5TKym3lfoxdTX6B55ThT4r

# DODO Payments Configuration (existing values)
DODO_PAYMENTS_API_KEY=0aBYUwVb1LZ5YQRE.m3TFoToJKYq89kJ0M6dIq9oaMLISOdbG-KS8C0RLghDZko5A
DODO_PAYMENTS_PRODUCT_ID=pdt_bPZdA5CeE8F4tjvgG43sD
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_1aGRk2itD6qLpF2l+Etr/hz9fTOn7JFN


# Reddit Configuration (with fallback)
REDDIT_CLIENT_ID=placeholder_reddit_id
REDDIT_CLIENT_SECRET=placeholder_reddit_secret

# Development Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
EOF

echo "Created development .env.local with fallback values"
echo "You can now run: npm run dev"
echo "The app will work with mock data for missing services"
