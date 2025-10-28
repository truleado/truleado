# HubSpot CRM Integration Setup

## ✅ Integration Complete!

New users are now automatically pushed to your HubSpot CRM when they sign up.

## How It Works

When a new user signs up:
1. User account is created in Truleado
2. Welcome email is sent (existing functionality)
3. **NEW**: User is pushed to HubSpot CRM (non-blocking)

## HubSpot Properties Synced

### Standard Properties
- `email` - User's email address
- `firstname` - First name
- `lastname` - Last name

### Custom Properties
- `truleado_user_id` - User's ID in Truleado
- `truleado_signup_date` - Date they signed up
- `truleado_trial_status` - Current trial status (active/expired)

## Configuration

### Environment Variables

Add to your Supabase project settings (or .env.local for local dev):

```bash
# HubSpot Credentials
HUBSPOT_ACCESS_TOKEN=your-access-token-here
HUBSPOT_PORTAL_ID=your-portal-id
```

### Finding Your Portal ID

1. Log into your HubSpot account
2. Click Settings (gear icon)
3. Go to **Account Defaults** → **Account Information**
4. Your Portal ID is shown under "Hub ID"

Or you can find it in any HubSpot URL:
- URL: `https://app.hubspot.com/contacts/124391540923456/contacts/`
- Portal ID: `123456`

## Safety Features

✅ **Non-blocking**: HubSpot errors never break user signup
✅ **Graceful degradation**: Works without HubSpot configured
✅ **Duplicate handling**: Won't create duplicate contacts
✅ **Error logging**: All issues logged for debugging
✅ **No app changes**: Existing functionality unchanged

## Testing

### Test User Signup Flow

1. Create a new test user account
2. Check browser console for: `✅ HubSpot: User pushed successfully`
3. Verify in HubSpot CRM that contact was created
4. Check custom properties are populated correctly

### Check Logs

```bash
# In Supabase Logs or browser console
✅ HubSpot: User pushed successfully: user@example.com
✅ HubSpot: Contact created successfully: contact-id
```

## Adding More Custom Properties

Edit `src/lib/hubspot-service.ts`:

```typescript
export function convertUserToHubSpotContact(...) {
  return {
    email: userEmail,
    firstname,
    lastname,
    truleado_user_id: userId,
    truleado_signup_date: signupDate,
    truleado_trial_status: 'active',
    // Add more properties here:
    truleado_plan_type: 'trial',
    truleado_product_count: productCount,
    // etc.
  }
}
```

Then create matching custom properties in HubSpot:
1. Go to **Settings** → **Properties**
2. Create **Contact** properties
3. Use exact same property names as in code

## Troubleshooting

### Users Not Appearing in HubSpot

1. Check access token is valid in `.env`
2. Check Portal ID is correct
3. Verify webhook is being called (check Supabase logs)
4. Check browser console for HubSpot errors

### Error: "Property does not exist"

Create the custom property in HubSpot first:
1. Go to **Settings** → **Properties**
2. Create contact property with exact name from code
3. Set property type correctly (text, number, date, etc.)

### Rate Limiting

HubSpot Free plan has rate limits:
- Burst: 100 requests per 10 seconds
- Sustained: 4 requests per second

Your signup rate should be well within these limits.

## Security

✅ Access token is stored as environment variable
✅ API calls use secure HTTPS
✅ No sensitive user data exposed in logs
✅ Graceful error handling prevents token leakage

## Next Steps

Consider adding these enhancements:
- Update HubSpot when user upgrades to Pro
- Sync user activity (product creation, lead tracking)
- Create deals in HubSpot for paying customers
- Add HubSpot workflow automation based on signup

Need help? Check Supabase logs or browser console for detailed error messages.

