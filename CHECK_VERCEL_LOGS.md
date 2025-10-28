# How to Check Vercel Logs for HubSpot Integration

## Step-by-Step Debugging:

### 1. Check Vercel Deployment Status
- Go to: https://vercel.com/dashboard
- Click on your Truleado project
- Check "Deployments" tab
- Is there a recent deployment (within last 5 minutes)?
- If not, you need to wait for the latest code to deploy

### 2. Check Function Logs
- In Vercel project, go to **"Functions"** tab
- Find **`/api/webhooks/supabase-auth`** function
- Click on it to see logs
- Create a NEW user account
- Watch the real-time logs

**What to look for:**

✅ **If you see this:**
```
✅ HubSpot: User pushed successfully: user@example.com
✅ HubSpot: Contact created successfully: contact-id
```
→ Everything is working! Check HubSpot CRM.

❌ **If you see this:**
```
⚠️  HubSpot: No access token configured, skipping contact creation
```
→ Environment variables not loaded. Redeploy or check env vars.

❌ **If you see this:**
```
❌ HubSpot: Failed to create contact: ...
```
→ Shows the exact error. Copy this error and share it with me.

❌ **If you DON'T see ANY HubSpot logs:**
→ Webhook might not be triggering. Check:
1. Is Supabase webhook configured?
2. Is it calling the correct URL?

### 3. Test the HubSpot Connection Directly
Visit: `https://your-domain.com/api/test-hubspot`

If it says "HubSpot integration is working!" → Integration is fine
If it shows an error → Share that error with me

### 4. Check Environment Variables
- In Vercel: Settings → Environment Variables
- Verify BOTH exist:
  - `HUBSPOT_ACCESS_TOKEN`
  - `HUBSPOT_PORTAL_ID`
- Make sure they're for **Production** environment
- Values should NOT be empty

## Quick Debug Checklist:

- [ ] Deployment completed in last 5 minutes?
- [ ] Environment variables exist in Vercel?
- [ ] Created NEW user account (not the old one)?
- [ ] Checked Vercel logs when creating user?
- [ ] Tested `/api/test-hubspot` endpoint?

