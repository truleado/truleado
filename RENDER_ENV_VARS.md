# 🚀 Render Environment Variables for Truleado
# Copy these to Render Dashboard > Environment Variables

# ===========================================
# SUPABASE CONFIGURATION (CRITICAL)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://romlagfefmiipxzmtywf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbWxhZ2ZlZm1paXB4em10eXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMTY0NDksImV4cCI6MjA3Mzg5MjQ0OX0.ZX-n868KJRAYrYUJkP5aaTsm7NEkWP7RMpd6Aw0aqyU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbWxhZ2ZlZm1paXB4em10eXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODMxNjQ0OSwiZXhwIjoyMDczODkyNDQ5fQ.cyQ2yOLKezlTXb3SIm29Q-xflpSprj5sM_rDjbF41fY

# ===========================================
# REDDIT API CONFIGURATION (CRITICAL)
# ===========================================
# You need to set these manually - they're not in Vercel
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
REDDIT_USERNAME=your_reddit_username_here
REDDIT_PASSWORD=your_reddit_password_here
REDDIT_USER_AGENT=Truleado Lead Discovery Bot 1.0

# Reddit OAuth Configuration
REDDIT_OAUTH_CLIENT_ID=your_reddit_oauth_client_id_here
REDDIT_OAUTH_CLIENT_SECRET=your_reddit_oauth_client_secret_here

# ===========================================
# AI API CONFIGURATION (CRITICAL)
# ===========================================
GOOGLE_GEMINI_API_KEY=AIzaSyDu4ApMHOkd_x5QImypTt4B8CGY53z9y6w
# OPENAI_API_KEY=your_openai_api_key_here  # Optional alternative

# ===========================================
# EMAIL CONFIGURATION (CRITICAL)
# ===========================================
RESEND_API_KEY=re_FMUirfLD_Gxk8JThCfh1e1nA6DNdojKay
NEXT_PUBLIC_RESEND_API_KEY=re_FMUirfLD_Gxk8JThCfh1e1nA6DNdojKay

# ===========================================
# PAYMENT CONFIGURATION (CRITICAL)
# ===========================================
# Paddle Configuration
PADDLE_API_KEY=pdl_live_apikey_01k6prasp29yd7jpcfe3w226rs_BTafARNkpQJmqQrY4m7GnS_ABF
PADDLE_ENVIRONMENT=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_25d9f288e9800c652de3ace238b
NEXT_PUBLIC_PADDLE_ENV=production
PADDLE_WEBHOOK_SECRET=pdl_ntfset_01k5kdsnfdba33ps8b1rg43sng_ROrLXKgPQFYJPQxngGGQUvsxSu6uRGIX

# DODO Payments Configuration (Alternative)
DODO_PAYMENTS_API_KEY=0aBYUwVb1LZ5YQRE.m3TFoToJKYq89kJ0M6dIq9oaMLISOdbG-KS8C0RLghDZko5A
DODO_PAYMENTS_PRODUCT_ID=pdt_bPZdA5CeE8F4tjvgG43sD
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_1aGRk2itD6qLpF2l+Etr/hz9fTOn7JFN

# ===========================================
# ZOHO CRM CONFIGURATION (CRITICAL)
# ===========================================
ZOHO_CLIENT_ID=1000.82DRWH7GU91XIPF7ZN9Q3W9KZ770GY
ZOHO_CLIENT_SECRET=30c61a291d791a0d1caa6e2ce193d069be007d6ea9
ZOHO_REFRESH_TOKEN=1000.1aa3bd63937b5fb65d8e970165babc99.4df927f0368af5b8807bea0ee715c8cb
ZOHO_API_DOMAIN=https://www.zohoapis.in
ZOHO_REDIRECT_URI=https://truleado.onrender.com/auth/zoho/callback

# ===========================================
# AUTHENTICATION CONFIGURATION
# ===========================================
# Generate new secrets for production
NEXTAUTH_SECRET=your_random_secret_here_generate_new_one
NEXTAUTH_URL=https://truleado.onrender.com

# ===========================================
# APP CONFIGURATION
# ===========================================
NEXT_PUBLIC_APP_URL=https://truleado.onrender.com
NODE_ENV=production

# ===========================================
# CRON JOB CONFIGURATION
# ===========================================
CRON_SECRET=your_cron_secret_for_authentication

# ===========================================
# RENDER DEPLOYMENT INSTRUCTIONS
# ===========================================
# 1. Go to https://render.com and sign up
# 2. Connect your GitHub repository
# 3. Create a new Web Service
# 4. Copy all the above environment variables to Render
# 5. Replace "truleado.onrender.com" with your actual Render domain
# 6. Set up Reddit API credentials (not included in Vercel)
# 7. Generate new secrets for NEXTAUTH_SECRET and CRON_SECRET
# 8. Deploy!
