# HubSpot Integration Setup Checklist

## ⚠️ TIME TO SYNC: Near Instant (< 1 second)

The integration happens **immediately** when a user signs up - no delays.

## But You Need to Complete Setup First:

### ✅ Step 1: Add Environment Variables
**Where:** Your deployment platform (Vercel/Railway/Render/etc.)

Add these TWO variables:
1. `HUBSPOT_ACCESS_TOKEN` = `<YOUR_HUBSPOT_ACCESS_TOKEN>`
2. `HUBSPOT_PORTAL_ID` = `243915409`

**Without these variables, the integration won't work!**

### ✅ Step 2: Redeploy
- Environment variables require a redeploy to take effect
- Wait 1-2 minutes for deployment

### ✅ Step 3: Create Custom Properties in HubSpot
Go to: HubSpot → Settings → Properties → Contact Properties

Create these properties:
1. **truleado_user_id** - Type: Single-line text
2. **truleado_signup_date** - Type: Date picker  
3. **truleado_trial_status** - Type: Single-line text

### ✅ Step 4: Test with NEW Account
- Create a fresh test user account
- Check appears in HubSpot **within 1 second**

## How to Verify It's Working

After deploying with env variables, check logs for:
```
✅ HubSpot: User pushed successfully: user@example.com
```

If you see warnings instead:
```
⚠️  HubSpot: No access token configured, skipping contact creation
```

→ Means environment variables aren't set yet

