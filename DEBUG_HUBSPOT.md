# Debugging HubSpot Integration

## ⚠️ Did You Redeploy After Adding Environment Variables?

Vercel requires a **redeploy** for new environment variables to take effect!

### Quick Steps:

1. **Check Vercel Deployment:**
   - Go to your Vercel dashboard
   - Look at the "Deployments" tab
   - Check if the latest deployment happened AFTER you added the environment variables
   - If not, trigger a redeploy (push a commit OR click "Redeploy")

2. **Check Vercel Logs:**
   - Go to your project in Vercel
   - Click on "Functions" tab
   - Look for `/api/webhooks/supabase-auth` function
   - Check the logs when a new user signs up
   - Look for these messages:
     ```
     ✅ HubSpot: User pushed successfully
     ```
     OR
     ```
     ⚠️ HubSpot: No access token configured
     ```

3. **Verify Environment Variables are Actually Set:**
   - In Vercel: Settings → Environment Variables
   - Make sure BOTH variables exist:
     - HUBSPOT_ACCESS_TOKEN
     - HUBSPOT_PORTAL_ID
   - Make sure they're set for the **Production** environment

4. **Create Custom Properties in HubSpot:**
   - Go to HubSpot → Settings → Properties → Contact Properties
   - Create these custom properties:
     - truleado_user_id
     - truleado_signup_date
     - truleado_trial_status

5. **Test Again:**
   - Create a NEW test user account
   - Check the logs immediately
   - Check HubSpot CRM → Contacts

## Most Common Issues:

1. **Not Redeployed** - Env vars added but deployment happened before
2. **Wrong Environment** - Env vars added to wrong environment (production vs preview)
3. **Custom Properties Missing** - HubSpot rejects unknown properties
4. **Webhook Not Triggering** - Supabase webhook not configured

