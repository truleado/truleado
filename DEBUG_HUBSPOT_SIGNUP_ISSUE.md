# Debugging: New Users Not Appearing in HubSpot

## Step 1: Check Vercel Environment Variables ✅

Go to your Vercel Dashboard → Your Project → Settings → Environment Variables

Make sure you have:
1. `HUBSPOT_ACCESS_TOKEN` = Your HubSpot access token
2. `HUBSPOT_PORTAL_ID` = Your HubSpot portal ID (243915409)

**If missing or incorrect:**
- Add the variables
- **REDEPLOY** your application
- Wait 2-3 minutes for deployment

## Step 2: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → **Functions** tab
2. Look for recent logs from `/api/webhooks/supabase-auth`

You should see one of these:

### ✅ Success Logs:
```
📧 HubSpot: Creating contact for: user@example.com
✅ HubSpot: User pushed successfully: user@example.com
✅ HubSpot: Contact created successfully: contact-id
```

### ❌ Warning Logs (Missing Token):
```
⚠️  HubSpot: No access token configured, skipping contact creation
```
→ **Fix**: Add environment variables and redeploy

### ❌ Error Logs:
```
❌ HubSpot error: 401 Unauthorized
❌ HubSpot error: Property values were not valid
```
→ **Fix**: See errors below

## Step 3: Check Common Issues

### Issue 1: HubSpot API Error 401 (Unauthorized)
**Cause**: Invalid or expired access token
**Fix**: 
- Generate a new Personal Access Token in HubSpot
- Update `HUBSPOT_ACCESS_TOKEN` in Vercel
- Redeploy

### Issue 2: Property Values Were Not Valid
**Cause**: Custom properties don't exist in HubSpot yet
**Fix**: Create the custom properties in HubSpot:
- `truleado_user_id` (single-line text)
- `truleado_signup_date` (date picker)
- `truleado_trial_status` (dropdown or single-line text)

See `HUBSPOT_CUSTOM_PROPERTIES_SETUP.md` for full instructions.

### Issue 3: Webhook Not Being Triggered
**Cause**: Supabase webhook not configured
**Fix**: 
1. Go to Supabase Dashboard → Database → Webhooks
2. Check if `supabase-auth` webhook exists
3. URL should be: `https://your-domain.com/api/webhooks/supabase-auth`
4. Events: Should trigger on `auth.users` INSERT

## Step 4: Test HubSpot Connection

Visit: `https://truleado.com/api/test-hubspot`

This will test:
- Environment variables are set
- Access token is valid
- API can create contacts
- Custom properties exist

Expected responses:

### ✅ Success:
```json
{
  "success": true,
  "message": "HubSpot integration is working!",
  "contactId": "123456"
}
```

### ❌ Missing Token:
```json
{
  "success": false,
  "error": "HubSpot not configured",
  "missing": "HUBSPOT_ACCESS_TOKEN"
}
```

### ❌ Invalid Token:
```json
{
  "success": false,
  "error": "HubSpot API error: 401 Unauthorized"
}
```

## Step 5: Create a Test Contact

Create a new test account on `truleado.com` and immediately check:

1. **Vercel Logs** - Look for HubSpot messages
2. **HubSpot CRM** - Go to Contacts → Search for the email
3. **Browser Console** - Check for any frontend errors

## Quick Checklist

- [ ] Environment variables set in Vercel
- [ ] Application redeployed after setting variables
- [ ] Test endpoint `/api/test-hubspot` returns success
- [ ] Custom properties created in HubSpot
- [ ] Supabase webhook configured correctly
- [ ] Creating a test account triggers the webhook
- [ ] No errors in Vercel logs

## Still Not Working?

Check these advanced issues:

### Issue: Custom Properties Not Allowed
**Error**: `Property "truleado_user_id" does not exist`
**Fix**: Remove custom properties from the code temporarily

Edit `src/lib/hubspot-service.ts` and comment out custom properties:
```typescript
properties: {
  email: contact.email,
  firstname: contact.firstname,
  lastname: contact.lastname,
  // truleado_user_id: contact.truleado_user_id,  // Commented out
  // truleado_signup_date: contact.truleado_signup_date,  // Commented out
  // truleado_trial_status: contact.truleado_trial_status,  // Commented out
}
```

Then:
1. Push changes
2. Redeploy
3. Test again
4. If works, create custom properties in HubSpot
5. Uncomment the lines
6. Redeploy again

## Need More Help?

Check these files for reference:
- `HUBSPOT_INTEGRATION_SETUP.md` - Full integration details
- `HUBSPOT_CUSTOM_PROPERTIES_SETUP.md` - Property setup guide
- `src/lib/hubspot-service.ts` - Integration code
- `src/app/api/webhooks/supabase-auth/route.ts` - Webhook handler

