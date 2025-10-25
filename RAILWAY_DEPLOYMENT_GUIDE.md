# 🚀 Railway Deployment Guide for Truleado

## ⚠️ **CRITICAL: Complete Setup Required Before Deployment**

Your app **WILL NOT WORK** on Railway without proper setup. Follow this guide completely.

## 📋 **Pre-Deployment Checklist**

### ✅ **1. Environment Variables Setup**

**REQUIRED Environment Variables for Railway:**

```bash
# Supabase Configuration (CRITICAL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Reddit API Configuration (CRITICAL for Chat & Find)
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
REDDIT_USERNAME=your-reddit-username
REDDIT_PASSWORD=your-reddit-password
REDDIT_USER_AGENT=Truleado Lead Discovery Bot 1.0

# Reddit OAuth Configuration (CRITICAL for Auth)
REDDIT_OAUTH_CLIENT_ID=your-reddit-oauth-client-id
REDDIT_OAUTH_CLIENT_SECRET=your-reddit-oauth-client-secret

# AI API Configuration (CRITICAL for Analysis)
OPENAI_API_KEY=your-openai-api-key
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Email Configuration (CRITICAL for Notifications)
RESEND_API_KEY=your-resend-api-key

# Payment Configuration (CRITICAL for Billing)
PADDLE_API_KEY=your-paddle-api-key
PADDLE_ENVIRONMENT=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your-paddle-client-token
NEXT_PUBLIC_PADDLE_PRICE_ID=your-paddle-price-id
PADDLE_WEBHOOK_SECRET=your-paddle-webhook-secret


# Authentication Configuration
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=https://your-railway-domain.railway.app

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-railway-domain.railway.app
NODE_ENV=production

# Cron Job Configuration
CRON_SECRET=your-cron-secret-for-authentication
```

### ✅ **2. Database Setup**

**CRITICAL: Your Supabase database must be properly configured:**

1. **Run the complete database schema:**
   - Copy contents of `database-schema.sql`
   - Run in Supabase SQL Editor

2. **Verify these tables exist:**
   - `profiles`
   - `products`
   - `leads`
   - `api_keys`
   - `chat_find_searches`
   - `chat_find_results`
   - `subscriptions`
   - `background_jobs`

3. **Verify RLS policies are enabled**

### ✅ **3. External Service Setup**

**Reddit API Setup:**
1. Go to https://www.reddit.com/prefs/apps
2. Create a new app (script type)
3. Get Client ID and Secret

**OpenAI/Gemini Setup:**
1. Get API key from OpenAI or Google Gemini
2. Add to environment variables

**Paddle Setup:**
1. Set up Paddle account
2. Get API keys and webhook secrets


## 🚀 **Railway Deployment Steps**

### **Step 1: Deploy to Railway**

```bash
# Login to Railway
railway login

# Initialize project
railway init

# Link to GitHub
railway link

# Deploy
railway up
```

### **Step 2: Set Environment Variables**

1. **Go to Railway Dashboard**
2. **Click on your project**
3. **Go to Variables tab**
4. **Add ALL environment variables from the list above**

### **Step 3: Get Railway Domain**

1. **Copy your Railway domain** (e.g., `https://your-app.railway.app`)
2. **Update these environment variables:**
   - `NEXTAUTH_URL=https://your-app.railway.app`
   - `NEXT_PUBLIC_APP_URL=https://your-app.railway.app`

### **Step 4: Update External Service URLs**

**Update these services with your Railway domain:**

1. **Supabase Auth Settings:**
   - Site URL: `https://your-app.railway.app`
   - Redirect URLs: `https://your-app.railway.app/auth/callback`

2. **Reddit OAuth Settings:**
   - Redirect URI: `https://your-app.railway.app/api/auth/reddit/callback`

3. **Paddle Settings:**
   - Webhook URL: `https://your-app.railway.app/api/webhooks/paddle`

## ⚠️ **Common Issues & Solutions**

### **Issue 1: App Crashes on Startup**
- **Cause**: Missing Supabase credentials
- **Solution**: Verify all Supabase environment variables are set

### **Issue 2: Chat & Find Not Working**
- **Cause**: Missing Reddit API credentials
- **Solution**: Set all Reddit environment variables

### **Issue 3: Database Errors**
- **Cause**: Database schema not set up
- **Solution**: Run `database-schema.sql` in Supabase

### **Issue 4: Payment Issues**
- **Cause**: Missing Paddle credentials
- **Solution**: Set all Paddle environment variables

### **Issue 5: Email Not Working**
- **Cause**: Missing Resend API key
- **Solution**: Set `RESEND_API_KEY`

## 🔍 **Testing After Deployment**

1. **Test Authentication:**
   - Sign up/Sign in
   - Verify user creation in Supabase

2. **Test Chat & Find:**
   - Try a search query
   - Verify results are saved

3. **Test Payments:**
   - Try to upgrade to Pro
   - Verify Paddle integration

4. **Test Lead Discovery:**
   - Connect Reddit account
   - Start lead discovery

## 📊 **Monitoring**

**Check these in Railway Dashboard:**
- **Deployments**: Ensure successful builds
- **Logs**: Monitor for errors
- **Metrics**: Check CPU/Memory usage

**Check these in Supabase:**
- **Database**: Verify data is being created
- **Auth**: Check user registrations
- **Logs**: Monitor for errors

## 🎯 **Success Criteria**

Your app is working correctly when:
- ✅ Users can sign up/sign in
- ✅ Chat & Find feature works
- ✅ Lead discovery works
- ✅ Payments work
- ✅ Email notifications work
- ✅ No errors in Railway logs

## 🆘 **If Something Goes Wrong**

1. **Check Railway logs** for specific errors
2. **Verify all environment variables** are set correctly
3. **Check Supabase** for database issues
4. **Test external services** individually
5. **Contact support** with specific error messages

---

**⚠️ REMEMBER: This app has complex dependencies. Take time to set up everything properly before expecting it to work!**
