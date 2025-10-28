# Set Up Supabase Webhook for HubSpot

Profiles are being created ✅, but they're not going to HubSpot ❌.

## The Problem

Your webhook endpoint exists (`/api/webhooks/supabase-auth`), but Supabase doesn't know to call it.

## The Solution

Configure a database webhook in Supabase.

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Log in
3. Select your Truleado project

### Step 2: Go to Database Webhooks
1. Click **"Database"** in left sidebar
2. Click **"Webhooks"** (or "Database Webhooks")
3. You should see a list of webhooks

### Step 3: Create New Webhook

Click **"+ New Webhook"** or **"Create Webhook"**

Fill in the form:

- **Name**: `Push Users to HubSpot` (or any name)
- **Enabled**: ✅ Check this box

**Events to listen for:**
- ✅ Check **INSERT** only

**Table:**
- Select: **`profiles`** (NOT auth.users!)

**HTTP Request:**
- **Method**: `POST`
- **URL**: `https://truleado.com/api/webhooks/supabase-auth`
- **Headers**: Leave empty

### Step 4: Save

Click **"Save"** or **"Create"**

### Step 5: Test

1. Create a NEW test user on truleado.com
2. Wait 5 seconds
3. Check Vercel logs for:
   ```
   📧 HubSpot: Creating contact for: user@example.com
   ✅ HubSpot: Contact created successfully
   ```
4. Check HubSpot CRM → Contacts
5. Should see the new contact!

## Why Use `profiles` Table?

Because:
- ✅ Profile is already created by trigger
- ✅ No timing issues
- ✅ Has all the data we need
- ✅ Webhook fires AFTER profile exists

## Troubleshooting

### Issue: No webhooks option in Dashboard

**Alternative method:**
1. Go to **Database** → **Triggers**
2. You might have a "Webhooks" tab there
3. Or use Supabase API directly

### Issue: 404 when webhook fires

**Check:**
1. Is the URL correct? `https://truleado.com/api/webhooks/supabase-auth`
2. Is your app deployed on Vercel?
3. Is the route file present? `src/app/api/webhooks/supabase-auth/route.ts`

### Issue: Webhook fires but HubSpot still not getting contacts

**Check Vercel logs for:**
```
⚠️  HubSpot: No access token configured
```

**Fix:** Add environment variables in Vercel:
- `HUBSPOT_ACCESS_TOKEN`
- `HUBSPOT_PORTAL_ID`

Then redeploy!

## Quick Checklist

- [ ] Go to Supabase → Database → Webhooks
- [ ] Click "Create Webhook"
- [ ] Table: `profiles`
- [ ] Events: INSERT only
- [ ] URL: `https://truleado.com/api/webhooks/supabase-auth`
- [ ] Save webhook
- [ ] Create test user
- [ ] Check Vercel logs
- [ ] Check HubSpot CRM

