# HubSpot Custom Properties Setup

This guide will help you create the custom properties in HubSpot to track Truleado user data.

## Required Custom Properties

Create these 3 custom properties in your HubSpot CRM:

### 1. `truleado_user_id` (Single-line text)
- **Internal name**: `truleado_user_id`
- **Display name**: "Truleado User ID"
- **Field type**: Single-line text
- **Group**: Contact information
- **Description**: Unique user ID from Truleado database

### 2. `truleado_signup_date` (Date picker)
- **Internal name**: `truleado_signup_date`
- **Display name**: "Truleado Signup Date"
- **Field type**: Date picker
- **Group**: Contact information
- **Description**: Date when the user signed up for Truleado

### 3. `truleado_trial_status` (Dropdown select)
- **Internal name**: `truleado_trial_status`
- **Display name**: "Truleado Trial Status"
- **Field type**: Dropdown select (or single-line text)
- **Group**: Contact information
- **Description**: Current trial status of the user
- **Options**:
  - `active` - Trial is active
  - `expired` - Trial has expired
  - `upgraded` - User has upgraded to paid plan
  - `cancelled` - User has cancelled

## How to Create These Properties

1. **Go to HubSpot Settings**
   - Click the gear icon (⚙️) in the top-right corner
   - Navigate to **Properties** → **Contact properties**

2. **Create Each Property**
   - Click **"Create property"**
   - Fill in the details:
     - **Name**: Enter the display name
     - **Internal name**: Enter the internal name (should auto-populate)
     - **Group**: Select "Contact information"
     - **Field type**: Select the appropriate type
     - **Options**: (for dropdown only) Add the options listed above
   - Click **"Create"**

3. **Verify Property Names**
   - Make sure the internal names match exactly:
     - `truleado_user_id`
     - `truleado_signup_date`
     - `truleado_trial_status`

## Property Details Reference

### Object Type
- All properties are for **Contact** objects
- They are stored under the **Contact information** group

### Field Group
- **Group**: Contact information
- All three properties should be in the same group for easy organization

## After Creating Properties

1. **Test the Integration**
   - Go to your Vercel deployment
   - Navigate to: `https://your-domain.com/api/test-hubspot`
   - This will verify that the custom properties are working

2. **Test with New User Signup**
   - Create a new test account on Truleado
   - Check your HubSpot CRM to see if all properties are populated
   - The contact should have:
     - Email (standard)
     - First Name / Last Name (standard)
     - Truleado User ID (custom)
     - Truleado Signup Date (custom)
     - Truleado Trial Status (custom, should be "active")

3. **Monitor Logs**
   - Check your Vercel deployment logs
   - Look for HubSpot success/error messages
   - Examples:
     - `✅ HubSpot: Contact created successfully`
     - `❌ HubSpot error: Property values were not valid`

## Troubleshooting

### Error: "Property values were not valid"
- **Cause**: Custom property doesn't exist in HubSpot
- **Solution**: Create the missing property using the steps above

### Error: "Property does not exist"
- **Cause**: Internal name doesn't match exactly
- **Solution**: Double-check the internal name matches exactly (case-sensitive)

### No Custom Properties Showing
- **Cause**: Properties might be hidden from the contact view
- **Solution**: 
  - Go to Settings → Properties → Contact properties
  - Find your custom property
  - Click "Edit"
  - Make sure "Show this property in the sidebar panel" is checked

## Code Configuration

The custom properties are already configured in:
- `src/lib/hubspot-service.ts` - Sends the properties to HubSpot
- `src/app/api/webhooks/supabase-auth/route.ts` - Populates the properties when a user signs up

## Property Format

The code sends data in this format:

```json
{
  "properties": {
    "email": "user@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "truleado_user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "truleado_signup_date": "2024-01-15T10:30:00.000Z",
    "truleado_trial_status": "active"
  }
}
```

## Next Steps

1. ✅ Create all 3 custom properties in HubSpot
2. ✅ Test the `/api/test-hubspot` endpoint
3. ✅ Create a test account and verify properties in HubSpot
4. ✅ Monitor production signups to ensure properties are populated

