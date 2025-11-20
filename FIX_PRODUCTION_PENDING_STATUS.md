# Fix: Production Users Not Being Blocked Until Payment

## Problem
On production, new users are getting access without completing checkout. This happens because:
1. The database trigger sets `subscription_status = 'trial'` by default
2. The webhook that should change it to `'pending'` may not be firing on production

## Solution
We've implemented a two-part fix:

### Part 1: Update Database Trigger (REQUIRED)
Run this SQL migration in your Supabase production database:

**File:** `migration-set-pending-status-on-signup.sql`

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `migration-set-pending-status-on-signup.sql`
3. Click "Run"

This will update the trigger to set `'pending'` status by default instead of `'trial'`.

### Part 2: Client-Side Fallback (Already Deployed)
The code now includes:
- A new API route: `/api/auth/ensure-pending-status` that ensures new users have pending status
- Signup page calls this API after successful signup
- This acts as a fallback if the webhook doesn't fire

### Part 3: Verify Webhook Configuration
Make sure your Supabase webhook is configured correctly:

1. Go to Supabase Dashboard → Database → Webhooks
2. Check if webhook exists for `profiles` table INSERT events
3. Verify the webhook URL points to your production domain:
   - **Production:** `https://your-production-domain.com/api/webhooks/supabase-auth`
   - **NOT:** `http://localhost:3000/api/webhooks/supabase-auth`

4. If webhook doesn't exist or has wrong URL:
   - Create/Edit webhook
   - Table: `profiles`
   - Events: `INSERT` only
   - URL: `https://your-production-domain.com/api/webhooks/supabase-auth`
   - Method: `POST`

## Testing
After applying the fix:

1. Create a new test account on production
2. User should be immediately redirected to `/checkout`
3. User should NOT be able to access dashboard or other features
4. After completing checkout, user should get access

## Files Changed
- `migration-set-pending-status-on-signup.sql` - Database migration (run in Supabase)
- `src/app/api/auth/ensure-pending-status/route.ts` - Client-side fallback API
- `src/app/auth/signup/page.tsx` - Calls fallback API after signup

