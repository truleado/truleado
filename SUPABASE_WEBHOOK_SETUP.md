# Supabase → HubSpot Integration Setup

## The Problem

Your HubSpot integration code is ready, but **Supabase is not configured to call it** when new users sign up.

## What's Missing

You need to set up a **Supabase Webhook** that calls your HubSpot integration when a new user signs up.

## Step-by-Step Setup

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com
- Log in to your account
- Select your Truleado project

### 2. Create a Database Webhook
1. Go to **Database** → **Webhooks**
2. Click **"Create a new webhook"** or **"+ New"**

### 3. Configure the Webhook

**Name:** `Push Users to HubSpot` (or any name you prefer)

**Enable:** ✅ Make sure it's enabled

**Supabase Publication:** Select **`supabase_realtime`**

**Database events:** 
- ✅ Check **INSERT** only

**Schema:** `public`

**Table:** `profiles` (NOT `auth.users` - we'll use the profile creation as the trigger)

### 4. Set the Endpoint

**HTTP Request:**

- **URL**: `https://truleado.com/api/webhooks/supabase-auth`
- **HTTP Method**: `POST`
- **HTTP Headers**: Leave empty (or add custom headers if needed)

### 5. Save the Webhook

Click **"Save"** or **"Create"**

## How It Works

1. User signs up on truleado.com
2. Supabase creates user in `auth.users`
3. Database trigger creates profile in `profiles` table
4. **Webhook fires** (INSERT event on profiles table)
5. Webhook calls: `https://truleado.com/api/webhooks/supabase-auth`
6. HubSpot contact is created

## Testing

After setting up the webhook:

1. **Create a new test account** on truleado.com
2. **Wait 2-3 seconds**
3. **Check HubSpot CRM** → Contacts
4. The new contact should appear!

## Troubleshooting

### Issue: Webhook not triggering

**Check:**
1. Is the webhook enabled?
2. Is the correct table selected (`profiles`)?
3. Is the URL correct (`https://truleado.com/api/webhooks/supabase-auth`)?
4. Are the events configured (INSERT)?

**Debug:**
1. Go to Supabase Dashboard → Database → Webhooks
2. Click on your webhook
3. Check "Webhook event logs" or "Activity"
4. See if requests are being sent
5. Check for error messages

### Issue: 404 or endpoint not found

**Fix:**
- Make sure the URL is exactly: `https://truleado.com/api/webhooks/supabase-auth`
- No trailing slash
- Check that your deployment is live on Vercel

### Issue: HubSpot still not getting contacts

**After webhook is set up, check:**
1. Vercel environment variables are set (HUBSPOT_ACCESS_TOKEN, HUBSPOT_PORTAL_ID)
2. Test endpoint: https://truleado.com/api/test-hubspot-connection
3. Vercel logs show HubSpot API calls

## Alternative: Using Supabase Edge Functions

If webhooks don't work, you can use Supabase Edge Functions:

```sql
-- Create a Supabase Edge Function that pushes to HubSpot
-- This would be a separate approach, but webhooks are simpler
```

But for now, **try the webhook approach first** - it's much easier!

## Quick Checklist

- [ ] Go to Supabase Dashboard → Database → Webhooks
- [ ] Create new webhook
- [ ] Table: `profiles`
- [ ] Events: INSERT only
- [ ] URL: `https://truleado.com/api/webhooks/supabase-auth`
- [ ] Save webhook
- [ ] Create test account on truleado.com
- [ ] Check HubSpot CRM for new contact
- [ ] Check Vercel logs for any errors

## Why Use `profiles` Table Instead of `auth.users`?

The `profiles` table is triggered by the database trigger you created. Using it as the webhook source ensures:
- Profile exists before webhook fires
- Webhook receives the correct user data
- No timing issues with profile creation

This is the **correct approach** for your setup!

