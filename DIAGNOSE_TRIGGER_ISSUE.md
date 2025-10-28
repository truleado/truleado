# Diagnose Trigger Issue

The profile trigger is NOT running. Follow these steps:

## Step 1: Check if Trigger Exists

Run this in **Supabase SQL Editor**:

```sql
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';
```

**Expected:** Should return 1 row
**If 0 rows:** Trigger doesn't exist - you need to run the SQL

## Step 2: Check if Function Exists

```sql
SELECT 
  proname AS function_name,
  prokind AS kind
FROM pg_proc
WHERE proname = 'handle_new_user';
```

**Expected:** Should return 1 row
**If 0 rows:** Function doesn't exist - you need to run the SQL

## Step 3: Check Trigger is Enabled

```sql
SELECT 
  tgname,
  tgenabled,
  CASE tgenabled
    WHEN 'O' THEN 'Enabled'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END AS status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

**Expected:** Should show "Enabled"
**If "Disabled":** Need to enable the trigger

## Step 4: Test the Function Manually

```sql
-- See if the function works at all
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';
```

This will show you the function code if it exists.

## Step 5: Run the Trigger Creation SQL

If trigger doesn't exist or is disabled:

1. Open `create-user-profile-trigger.sql`
2. Copy ALL contents
3. Run in Supabase SQL Editor
4. Should see: "✅ User profile trigger created successfully!"

## Step 6: Verify It's Working

After running the SQL, create a test user and check:

```sql
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.id AS profile_id,
  p.email AS profile_email,
  p.subscription_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.created_at > NOW() - INTERVAL '1 hour'
ORDER BY au.created_at DESC
LIMIT 5;
```

**Expected:** All users should have a profile_id
**If missing profiles:** Trigger still not working

## Common Issues

### Issue: SQL says "successful" but still doesn't work

**Possible causes:**
1. Wrong database connection
2. Missing permissions
3. Schema mismatch

**Fix:** Check Supabase project settings

### Issue: Function exists but trigger doesn't

**Fix:** Run this:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Issue: Trigger exists but is disabled

**Fix:** Enable it:
```sql
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

## Quick Solution

If nothing works, try this complete reset:

```sql
-- Completely remove and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, subscription_status, trial_ends_at, trial_count, last_trial_at, created_at, updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'trial',
    NOW() + INTERVAL '7 days',
    1,
    NOW(),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

