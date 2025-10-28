# Setup Database Trigger to Fix Profile Creation Error

## The Problem

You're seeing this error:
```
Error fetching user profile after retry: {
  code: 'PGRST116',
  details: 'The result contains 0 rows',
  message: 'Cannot coerce the result to a single JSON object'
}
```

**This means:** The database trigger that creates profiles isn't working.

## The Solution

Run the SQL script `create-user-profile-trigger.sql` in your Supabase dashboard.

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to: https://supabase.com
- Log in to your account
- Select your Truleado project

### 2. Open SQL Editor
- Click on **"SQL Editor"** in the left sidebar
- Click **"New Query"** button (top right)

### 3. Run the SQL Script
- Open the file `create-user-profile-trigger.sql` in this project
- Copy **ALL** the contents
- Paste into the SQL Editor
- Click **"Run"** button (or press `Cmd+Enter` / `Ctrl+Enter`)

### 4. Verify Success
You should see:
```
✅ User profile trigger created successfully!
✅ New users will automatically get profiles with 7-day trials
```

### 5. Test It
- Create a new test account on truleado.com
- The profile should now be created automatically
- Check that the error is gone

## What This Does

The trigger:
1. **Watches** for new user signups in `auth.users`
2. **Automatically creates** a profile in `public.profiles`
3. **Sets up** a 7-day trial period
4. **Makes the HubSpot integration work** (because profiles exist)

## Why This Happened

The database trigger either:
- Was never created in your Supabase project
- Was accidentally deleted
- Got out of sync with your code

## After Setup

✅ New users will get profiles automatically
✅ Trial period will be 7 days
✅ HubSpot integration will work
✅ No more "PGRST116" errors

## Troubleshooting

### Issue: "Function already exists"
**Solution:** The script handles this with `DROP FUNCTION IF EXISTS`, so just run it again.

### Issue: "Permission denied"
**Solution:** 
- Make sure you're using the SQL Editor as the project owner
- Or have admin access to the database

### Issue: Trigger still doesn't work after running
**Solution:**
1. Check if the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
   Should return 1 row

2. Check if the function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```
   Should return 1 row

3. If both exist but still not working, create a fresh test user and check the profiles table

### Issue: Still getting the error
**Solution:**
- Check Supabase logs in Dashboard → Logs → Database Logs
- Look for errors when creating profiles
- Make sure the `profiles` table exists and has the correct structure

## Need Help?

If the trigger still doesn't work after following these steps, the issue might be:
1. Database permissions
2. Missing columns in the profiles table
3. Row Level Security (RLS) policies blocking inserts

Check the Supabase dashboard for detailed error messages.

