# Detailed Steps: Set Up Database Trigger in Supabase

## The Goal

When a new user signs up, automatically create a profile in the `profiles` table with a 7-day trial.

## Step-by-Step Instructions

### Method 1: Using Supabase SQL Editor (Recommended)

#### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Log in to your account
3. Click on your **Truleado** project

#### Step 2: Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click the **"New Query"** button (top right, green button)

#### Step 3: Paste the SQL Script
1. Open the file: `fix-trigger-permissions.sql` (in your project)
2. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
3. **Paste into the SQL Editor**

#### Step 4: Run the SQL
1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for it to complete
3. You should see: "✅ Trigger recreated with proper permissions"

#### Step 5: Verify It Worked
Run this query to check:

```sql
SELECT 
  tgname AS trigger_name,
  CASE tgenabled
    WHEN 'O' THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END AS status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

**Expected result:** Should show 1 row with "✅ Enabled"

#### Step 6: Test It
1. Go to your app: https://truleado.com
2. Create a **NEW test account** (use a different email)
3. Wait 5 seconds
4. Go back to Supabase → Table Editor → `profiles`
5. Search for the email you just used
6. **The profile should exist!**

---

### Method 2: If Method 1 Doesn't Work (Permission Error)

If you get "must be owner of table users" error:

#### Option A: Use Supabase Dashboard (Visual Way)

1. Go to **Database** → **Triggers**
2. Click **"Create Trigger"** or **"+ New Trigger"**
3. Fill in the form:
   - **Name**: `on_auth_user_created`
   - **Table**: `auth.users` (select from dropdown)
   - **Events**: Check ✅ **INSERT**
   - **Type**: Select **Function**
   - **Function**: You'll need to create this first (see below)

4. **First, create the function:**
   - Go to **Database** → **Functions**
   - Click **"Create New Function"**
   - Fill in:
     - **Name**: `handle_new_user`
     - **Return type**: `trigger`
     - **Language**: `plpgsql`
     - **Definition**: Copy from the function in `fix-trigger-permissions.sql` (the part inside `$$`)
   - Click **"Save"**

5. **Then create the trigger:**
   - Go back to Triggers → Create Trigger
   - Select the function you just created
   - Click **"Save"**

#### Option B: Run SQL as Service Role User

If you have service_role credentials:

1. In Supabase Dashboard → **Settings** → **API**
2. Find your **service_role** key (secret)
3. Use this in your SQL connection instead of anon key
4. Run `fix-trigger-permissions.sql` with service_role credentials

---

## Troubleshooting

### Issue: "Trigger exists but still not creating profiles"

**Check:**
```sql
-- See if function is being called
SELECT proname, prosecdef FROM pg_proc 
WHERE proname = 'handle_new_user';
-- prosecdef should be 't' (true)

-- Check if trigger is enabled
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
-- tgenabled should be 'O' (enabled)
```

### Issue: Still seeing PGRST116 error

**Possible causes:**
1. Trigger not running at all
2. Function failing silently
3. Profile table has different schema

**Fix:**
```sql
-- Check what's actually in profiles table for a new user
SELECT * FROM public.profiles 
WHERE email = 'youremail@example.com';

-- If profile exists but webhook fails, it's a webhook issue
-- If profile doesn't exist, trigger isn't running
```

### Issue: Created profiles but HubSpot still not working

**This is separate!** HubSpot needs:
1. Environment variables in Vercel
2. Supabase webhook configured (you already have this)
3. HubSpot custom properties created

See: `HUBSPOT_CUSTOM_PROPERTIES_SETUP.md`

---

## What Success Looks Like

After setting up correctly:

1. ✅ Trigger exists and is enabled
2. ✅ Function exists with SECURITY DEFINER
3. ✅ New user signs up
4. ✅ Profile automatically created in database
5. ✅ Webhook fires
6. ✅ HubSpot gets the contact
7. ✅ No PGRST116 errors

---

## Quick Checklist

- [ ] Go to Supabase SQL Editor
- [ ] Run `fix-trigger-permissions.sql` (copy ALL contents)
- [ ] Verify trigger exists (run check query)
- [ ] Create test account on truleado.com
- [ ] Check profiles table for new profile
- [ ] Check Vercel logs for HubSpot messages
- [ ] Check HubSpot CRM for new contact

---

## Important Files in This Project

- `fix-trigger-permissions.sql` - Main trigger setup
- `create-user-profile-trigger.sql` - Alternative setup (simpler)
- `check-trigger-status.sql` - Check if trigger exists
- `test-manual-profile-creation.sql` - Test profile creation manually

---

## Still Not Working?

If none of this works:

1. **Check Supabase logs:**
   - Supabase Dashboard → Logs
   - Look for errors related to triggers

2. **Try manual test:**
   - Run `test-manual-profile-creation.sql`
   - See if profile can be created manually

3. **Contact Supabase Support:**
   - They can help with trigger permissions
   - Service role access issues

4. **Alternative approach:**
   - Use Supabase Edge Functions instead of triggers
   - Less convenient but more control

