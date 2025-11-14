# 🔐 Supabase Authentication Configuration for Vercel

## **Critical: Configure Supabase Auth Settings**

Even if your keys are correct, you need to configure Supabase authentication settings for your Vercel domain.

## **Step 1: Get Your Vercel Domain**

1. Go to your Vercel project dashboard
2. Your domain will be something like: `https://your-project.vercel.app`
3. Copy this domain

## **Step 2: Configure Supabase Auth Settings**

1. Go to **[supabase.com/dashboard](https://supabase.com/dashboard)**
2. **Select your project**
3. Go to **Authentication** → **URL Configuration** (or **Settings**)
4. Configure these settings:

   **a) Site URL**
   - Set to your Vercel domain: `https://your-project.vercel.app`
   - This is the main URL where your app is hosted

   **b) Redirect URLs**
   - Click **Add URL** or edit the list
   - Add these URLs (one per line):
     ```
     https://your-project.vercel.app/dashboard
     https://your-project.vercel.app/auth/callback
     https://your-project.vercel.app/**
     ```
   - The `/**` wildcard allows all paths under your domain
   - **Important**: Include both with and without trailing slash if needed

5. **Save** the settings

## **Step 3: Check Email Provider Settings**

1. Still in **Authentication** → **Providers**
2. Make sure **Email** provider is **Enabled**
3. Check these settings:
   - **Enable email confirmations**: Can be disabled for testing, but recommended for production
   - **Secure email change**: Recommended
   - **Double confirm email changes**: Optional

## **Step 4: Verify Environment Variables in Vercel**

Double-check these are set correctly:

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Verify:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service_role key
3. Make sure they're enabled for **Production**

## **Step 5: Test the Configuration**

After configuring:

1. **Redeploy** on Vercel (or wait for auto-deploy)
2. **Open browser console** (F12 → Console tab)
3. **Try to sign in**
4. **Check for specific errors**:
   - Look for CORS errors
   - Look for network errors
   - Look for Supabase-specific error messages

## **Common Issues:**

### ❌ **Issue: "Failed to fetch" or Network Error**

**Possible Causes:**
1. **Redirect URLs not configured** in Supabase
   - **Fix**: Add your Vercel domain to Supabase redirect URLs

2. **Site URL mismatch**
   - **Fix**: Make sure Site URL in Supabase matches your Vercel domain

3. **CORS error**
   - **Fix**: Supabase should handle CORS automatically, but check redirect URLs

4. **Environment variables not in browser**
   - **Fix**: Make sure variables have `NEXT_PUBLIC_` prefix
   - **Fix**: Redeploy after adding variables

### ❌ **Issue: "Invalid API key" or "Unauthorized"**

**Possible Causes:**
1. **Wrong anon key**
   - **Fix**: Double-check the key in Vercel matches Supabase dashboard

2. **Key has extra spaces/quotes**
   - **Fix**: Remove any quotes or spaces around the key

### ❌ **Issue: "Email not confirmed"**

**Possible Causes:**
1. **Email confirmation required**
   - **Fix**: Check Supabase Auth → Email settings
   - **Fix**: Either enable email confirmations or disable for testing

## **Debugging Steps:**

### **1. Check Browser Console**

Open browser console (F12) and look for:
- Network errors
- CORS errors
- Supabase error messages
- Any red error messages

### **2. Check Network Tab**

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to sign in
4. Look for failed requests to `*.supabase.co`
5. Click on failed requests to see error details

### **3. Test Supabase Connection**

Create a test file to verify Supabase is accessible:

```javascript
// Test in browser console on your Vercel site
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_ANON_KEY'

fetch(`${supabaseUrl}/rest/v1/`, {
  headers: {
    'apikey': supabaseKey
  }
})
.then(r => console.log('✅ Supabase accessible', r))
.catch(e => console.error('❌ Supabase error', e))
```

### **4. Check Vercel Logs**

1. Go to Vercel → Deployments → Latest deployment
2. Click **Functions** tab
3. Look for any Supabase-related errors
4. Check middleware logs for Supabase errors

## **Quick Checklist:**

- [ ] Supabase Site URL set to your Vercel domain
- [ ] Redirect URLs include your Vercel domain
- [ ] Email provider enabled in Supabase
- [ ] Environment variables set in Vercel with `NEXT_PUBLIC_` prefix
- [ ] Variables enabled for Production environment
- [ ] No quotes or spaces around environment variable values
- [ ] Redeployed after making changes

## **Still Not Working?**

If you've checked everything above and it's still not working:

1. **Share the exact error message** from browser console
2. **Check Network tab** for the failed request details
3. **Verify Supabase project is active** (not paused)
4. **Test with a simple Supabase query** to verify connectivity

