# 🔑 How to Get Your Supabase Keys

## **You DON'T Need New Keys!**

Just get your existing keys from your Supabase project and make sure they're set in Vercel.

## **Step-by-Step Guide:**

### **1. Get Keys from Supabase Dashboard**

1. Go to **[supabase.com/dashboard](https://supabase.com/dashboard)**
2. **Select your project** (or create one if you don't have one)
3. Click **Settings** (gear icon in left sidebar)
4. Click **API** in the settings menu
5. You'll see three important values:

   **a) Project URL**
   - Look for "Project URL" or "URL"
   - Format: `https://xxxxx.supabase.co`
   - Copy this → Use for `NEXT_PUBLIC_SUPABASE_URL`

   **b) anon public key**
   - Look for "anon" or "public" key
   - Long JWT token starting with `eyJ...`
   - Copy this → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   **c) service_role key**
   - Look for "service_role" key (⚠️ Keep this secret!)
   - Long JWT token starting with `eyJ...`
   - Copy this → Use for `SUPABASE_SERVICE_ROLE_KEY`

### **2. Set Keys in Vercel**

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard)**
2. **Select your Truleado project**
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar
5. **Add/Update these three variables:**

   ```
   NEXT_PUBLIC_SUPABASE_URL
   Value: https://your-project-id.supabase.co
   (No quotes, no trailing slash)
   
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   (No quotes, the full long token)
   
   SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   (No quotes, the full long token)
   ```

6. **Important**: Make sure all three are enabled for:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

### **3. Redeploy**

After adding/updating variables:
- Vercel will auto-deploy, OR
- Click **Deployments** → **Redeploy** latest deployment

### **4. Test**

After deployment completes:
- Try signing in again
- Check browser console (F12) for any errors
- The "Failed to fetch" error should be gone

## **Common Mistakes to Avoid:**

❌ **Don't add quotes** around the values
- Wrong: `"https://xxx.supabase.co"`
- Right: `https://xxx.supabase.co`

❌ **Don't add trailing slashes**
- Wrong: `https://xxx.supabase.co/`
- Right: `https://xxx.supabase.co`

❌ **Don't forget the `NEXT_PUBLIC_` prefix**
- The browser needs `NEXT_PUBLIC_` prefix to access these variables
- `SUPABASE_URL` won't work, must be `NEXT_PUBLIC_SUPABASE_URL`

❌ **Don't use the wrong key**
- `anon public` key → for `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser/client)
- `service_role` key → for `SUPABASE_SERVICE_ROLE_KEY` (server only)

## **Still Having Issues?**

1. **Check browser console** (F12 → Console tab)
   - Look for error messages about Supabase
   - Should see warnings if keys are missing

2. **Check Vercel logs**
   - Go to Deployments → Latest → Functions tab
   - Look for Supabase-related errors

3. **Verify keys are correct**
   - Compare keys in Vercel with keys in Supabase dashboard
   - Make sure they match exactly (no extra spaces)

4. **Test locally first**
   - Add keys to `.env.local` file
   - Run `npm run dev`
   - Test sign in locally
   - If it works locally but not on Vercel, it's a Vercel config issue

## **When You Actually Need New Keys:**

Only create new keys if:
- You've lost access to your Supabase project
- Keys have been compromised/leaked
- You want to start fresh with a new project

Otherwise, just use your existing keys!

