# 🔍 Vercel Environment Variables Check

## **Critical: Verify These Environment Variables Are Set**

The middleware requires these environment variables to work properly. If they're missing or incorrect, you'll get `MIDDLEWARE_INVOCATION_FAILED` errors.

### **Required for Middleware:**

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Format: `https://your-project-id.supabase.co`
   - Must start with `https://`
   - No trailing slash
   - Example: `https://romlagfefmiipxzmtywf.supabase.co`

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - Format: JWT token (long string starting with `eyJ`)
   - Should be ~200+ characters
   - No quotes around the value
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## **How to Check on Vercel:**

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Verify both variables exist and have correct values
4. Make sure they're enabled for **Production**, **Preview**, and **Development**

## **Common Issues:**

### ❌ **Problem: Variables Not Set**
- **Symptom**: Middleware fails with 500 error
- **Fix**: Add the variables in Vercel dashboard

### ❌ **Problem: Empty Values**
- **Symptom**: Middleware skips Supabase auth (works but no auth)
- **Fix**: Make sure values aren't empty strings

### ❌ **Problem: Extra Quotes**
- **Symptom**: Supabase client fails to initialize
- **Fix**: Remove quotes from values in Vercel (e.g., use `https://...` not `"https://..."`)

### ❌ **Problem: Wrong Environment Scope**
- **Symptom**: Variables work locally but not on Vercel
- **Fix**: Make sure variables are enabled for Production environment

### ❌ **Problem: Variables Not Redeployed**
- **Symptom**: Added variables but still getting errors
- **Fix**: After adding variables, trigger a new deployment

## **Quick Test:**

After setting variables, check Vercel function logs:
- Go to **Deployments** → Click latest deployment → **Functions** tab
- Look for middleware logs
- Should see: "Missing Supabase environment variables" (if missing) or no errors (if set)

## **All Required Environment Variables:**

For the full application to work, you also need:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Reddit OAuth (REQUIRED)
REDDIT_OAUTH_CLIENT_ID=your-client-id
REDDIT_OAUTH_CLIENT_SECRET=your-client-secret

# AI (REQUIRED)
GOOGLE_GEMINI_API_KEY=your-gemini-key

# Email (REQUIRED)
RESEND_API_KEY=your-resend-key

# Payment (REQUIRED)
PADDLE_API_KEY=your-paddle-key
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your-client-token
NEXT_PUBLIC_PADDLE_PRICE_ID=your-price-id
PADDLE_WEBHOOK_SECRET=your-webhook-secret

# Auth (REQUIRED)
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

## **After Adding Variables:**

1. **Redeploy** your application (Vercel will auto-deploy or trigger manually)
2. **Wait for deployment** to complete
3. **Test** the application - middleware errors should be gone
4. **Check logs** if issues persist

