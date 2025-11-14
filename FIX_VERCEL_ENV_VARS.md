# 🚨 URGENT: Fix Vercel Environment Variables

## **Problem Identified:**
Your Supabase environment variables are **NOT available in the browser**. The console shows:
```
❌ Supabase environment variables are missing or empty
⚠️ Supabase credentials missing in browser
```

## **Why This Happens:**
In Next.js, environment variables are only available in the browser if they start with `NEXT_PUBLIC_`. Regular environment variables are only available on the server.

## **Quick Fix Steps:**

### **Step 1: Go to Vercel Environment Variables**

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard)**
2. **Click on your Truleado project**
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar

### **Step 2: Check Your Variables**

Look for these **EXACT** variable names (case-sensitive):

- ✅ `NEXT_PUBLIC_SUPABASE_URL` (must have `NEXT_PUBLIC_` prefix)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (must have `NEXT_PUBLIC_` prefix)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (no prefix needed - server only)

### **Step 3: Fix Missing Prefix**

If you see variables named:
- ❌ `SUPABASE_URL` (wrong - missing prefix)
- ❌ `SUPABASE_ANON_KEY` (wrong - missing prefix)

**Fix:**
1. **Add new variables** with correct names:
   - `NEXT_PUBLIC_SUPABASE_URL` = (copy value from old variable)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (copy value from old variable)
2. **Delete the old variables** (without `NEXT_PUBLIC_` prefix)
3. **OR rename them** if Vercel allows

### **Step 4: Check Environment Scope**

For each variable, make sure it's enabled for:
- ✅ **Production** (required!)
- ✅ **Preview** (recommended)
- ✅ **Development** (optional, for local dev)

**How to check:**
- Look at the variable row
- See which environments are checked
- If Production is NOT checked, click to enable it

### **Step 5: Verify Values**

Make sure the values are correct:

**`NEXT_PUBLIC_SUPABASE_URL`:**
- Format: `https://your-project-id.supabase.co`
- No trailing slash
- No quotes around the value
- Example: `https://romlagfefmiipxzmtywf.supabase.co`

**`NEXT_PUBLIC_SUPABASE_ANON_KEY`:**
- Long JWT token starting with `eyJ...`
- No quotes around the value
- No spaces before/after
- Should be ~200+ characters

### **Step 6: Redeploy**

**CRITICAL:** After adding/updating variables, you MUST redeploy:

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. **OR** push a new commit to trigger auto-deploy

**Important:** Just adding variables isn't enough - you need to redeploy for them to take effect!

## **Quick Checklist:**

- [ ] Variables named `NEXT_PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`)
- [ ] Variables named `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)
- [ ] Both variables enabled for **Production**
- [ ] Values are correct (no quotes, no trailing slashes)
- [ ] **Redeployed** after making changes

## **After Fixing:**

1. **Wait for deployment** to complete (2-3 minutes)
2. **Refresh your site**
3. **Open browser console** (F12)
4. **Try to sign in**
5. **Check console** - should see:
   ```
   ✅ Supabase client created successfully
   🔐 Attempting sign in: ...
   🌐 Supabase connectivity test: ...
   ```

## **Still Not Working?**

If you've done everything above and it's still not working:

1. **Double-check variable names** - they must be EXACT:
   - `NEXT_PUBLIC_SUPABASE_URL` (not `NEXT_PUBLIC_SUPABASE_URL ` with space)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (case-sensitive)

2. **Check for typos** - copy-paste the variable names from this guide

3. **Verify in Vercel logs:**
   - Go to Deployments → Latest → Build Logs
   - Search for "NEXT_PUBLIC_SUPABASE"
   - Should see the variables being set

4. **Try clearing browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in incognito/private window

## **Common Mistakes:**

❌ **Variable name:** `SUPABASE_URL`
✅ **Correct:** `NEXT_PUBLIC_SUPABASE_URL`

❌ **Value:** `"https://xxx.supabase.co"` (with quotes)
✅ **Correct:** `https://xxx.supabase.co` (no quotes)

❌ **Value:** `https://xxx.supabase.co/` (with trailing slash)
✅ **Correct:** `https://xxx.supabase.co` (no trailing slash)

❌ **Not enabled for Production**
✅ **Must enable for Production**

❌ **Added variables but didn't redeploy**
✅ **Must redeploy after adding variables**

