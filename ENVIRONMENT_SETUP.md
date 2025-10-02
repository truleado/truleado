# 🚨 CRITICAL: Environment Variables Setup Required

## **Problem Identified**
Your auto lead finding is **NOT working** because Supabase environment variables are missing. The job scheduler cannot connect to the database, causing all "fetch failed" errors.

## **Required Environment Variables**

Create a `.env.local` file in your project root with these variables:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Reddit OAuth Configuration (REQUIRED)
REDDIT_OAUTH_CLIENT_ID=your-reddit-client-id
REDDIT_OAUTH_CLIENT_SECRET=your-reddit-client-secret

# Other Required Variables
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Optional: Paddle Configuration
PADDLE_VENDOR_ID=your-paddle-vendor-id
PADDLE_API_KEY=your-paddle-api-key
PADDLE_WEBHOOK_SECRET=your-paddle-webhook-secret

# Optional: Zoho Configuration
ZOHO_CLIENT_ID=your-zoho-client-id
ZOHO_CLIENT_SECRET=your-zoho-client-secret
ZOHO_REFRESH_TOKEN=your-zoho-refresh-token

# Optional: Cron Configuration
CRON_SECRET=your-cron-secret-for-authentication

# Optional: AI Analysis Configuration (Choose one or both)
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here  # Recommended: Cheaper than OpenAI
OPENAI_API_KEY=your-openai-api-key-here                # Alternative: More expensive
```

## **How to Get Supabase Credentials**

1. **Go to your Supabase project dashboard**
2. **Navigate to Settings > API**
3. **Copy the following:**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## **How to Get Reddit OAuth Credentials**

1. **Go to https://www.reddit.com/prefs/apps**
2. **Create a new app** (choose "web app")
3. **Copy the following:**
   - **Client ID** → `REDDIT_OAUTH_CLIENT_ID`
   - **Client Secret** → `REDDIT_OAUTH_CLIENT_SECRET`

## **How to Get AI API Keys (Optional)**

### **Google Gemini API (Recommended - Cheaper)**
1. **Go to https://makersuite.google.com/app/apikey**
2. **Click "Create API Key"**
3. **Copy the API key** → `GOOGLE_GEMINI_API_KEY`
4. **Free tier**: 15 requests per minute, 1500 requests per day

### **OpenAI API (Alternative - More Expensive)**
1. **Go to https://platform.openai.com/api-keys**
2. **Click "Create new secret key"**
3. **Copy the API key** → `OPENAI_API_KEY`
4. **Note**: Requires billing setup, no free tier

## **After Setting Up Environment Variables**

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Test the connection:**
   ```bash
   node test-reddit-token-refresh.js
   ```

3. **Check if lead discovery is working:**
   - Go to `http://localhost:3000/leads`
   - Look for leads in the dashboard

## **Production Deployment**

Make sure to set these environment variables in your production environment:
- **Vercel**: Add them in Project Settings > Environment Variables
- **Railway**: Add them in Variables tab
- **Other platforms**: Follow their environment variable setup guide

## **Current Status**

❌ **Auto lead finding is NOT working** due to missing Supabase configuration
✅ **Code is ready** - just needs environment variables
✅ **Token refresh system** is implemented and ready
✅ **Favicon** is updated and ready

## **Next Steps**

1. Set up environment variables (above)
2. Restart the server
3. Test lead discovery
4. Deploy to production with environment variables

---

**This is a critical fix needed for your app to function properly!**
