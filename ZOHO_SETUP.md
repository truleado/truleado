# Zoho CRM Integration Setup Guide

This guide will help you set up automatic contact creation in Zoho CRM when users sign up for Truleado.

## 🚀 Quick Setup

### Step 1: Get Zoho CRM API Credentials

1. **Go to [Zoho API Console](https://api-console.zoho.com)**
2. **Sign in** with your Zoho account
3. **Create a new app**:
   - Click "Add Client"
   - Choose "Server-based Applications"
   - Enter app name: "Truleado CRM Integration"
   - Enter redirect URI: `https://truleado.com/auth/zoho/callback`
   - Click "Create"

4. **Copy the credentials**:
   - Client ID
   - Client Secret

### Step 2: Generate Refresh Token

1. **Go to [Zoho OAuth Playground](https://api-console.zoho.com/oauthplayground)**
2. **Enter your credentials**:
   - Client ID: (from step 1)
   - Client Secret: (from step 1)
   - Redirect URI: `https://truleado.com/auth/zoho/callback`

3. **Generate refresh token**:
   - Click "Generate Code"
   - Authorize the application
   - Copy the **Refresh Token**

### Step 3: Add Environment Variables to Vercel

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables** and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `ZOHO_CLIENT_ID` | `1000.xxxxx` | Your Zoho app client ID |
| `ZOHO_CLIENT_SECRET` | `xxxxx` | Your Zoho app client secret |
| `ZOHO_REFRESH_TOKEN` | `1000.xxxxx` | Generated refresh token |
| `ZOHO_REDIRECT_URI` | `https://truleado.com/auth/zoho/callback` | OAuth redirect URI |
| `ZOHO_API_DOMAIN` | `https://www.zohoapis.com` | Zoho API domain |

**Enable all variables for**: ✅ Production, ✅ Preview, ✅ Development

### Step 4: Run Database Migration

Execute this SQL in your **Supabase SQL Editor**:

```sql
-- Add Zoho CRM integration fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS zoho_contact_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS zoho_contact_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS zoho_contact_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS company VARCHAR(255);

-- Create index for Zoho contact lookups
CREATE INDEX IF NOT EXISTS idx_profiles_zoho_contact 
ON profiles (zoho_contact_id);
```

### Step 5: Test the Integration

1. **Redeploy your Vercel project**
2. **Visit** `https://truleado.com/test-zoho`
3. **Click "Create Zoho Contact"**
4. **Check your Zoho CRM** for the new contact

## 📊 What Gets Created

### Contact Fields in Zoho CRM

| Field | Value | Description |
|-------|-------|-------------|
| **First Name** | User's first name | From signup form |
| **Last Name** | User's last name | From signup form |
| **Email** | User's email | From signup form |
| **Phone** | User's phone | From profile (if provided) |
| **Lead Source** | "Truleado Website" | Fixed value |
| **Lead Status** | "Not Contacted" | Initial status |
| **Company** | User's company | From profile or "Individual" |
| **Description** | Signup details | Trial status and notes |
| **Custom Field 1** | User ID | Internal user identifier |
| **Custom Field 2** | Signup Date | When user signed up |
| **Custom Field 3** | Trial Status | Current subscription status |

## 🔄 Automatic Integration

### When Contacts Are Created

- ✅ **User signup** (email/password)
- ✅ **Google OAuth signup**
- ✅ **Manual contact creation** (via test page)

### When Contacts Are Updated

- ✅ **Subscription status changes**
- ✅ **Profile information updates**
- ✅ **Trial to paid conversion**

## 🧪 Testing

### Test Page
Visit `/test-zoho` to test the integration:
- Creates a contact using your current user data
- Shows success/error messages
- Displays contact ID if successful

### Manual Testing
```bash
# Test contact creation API
curl -X POST https://truleado.com/api/zoho/create-contact \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## 🔧 Configuration

### Custom Fields Setup

To use custom fields in Zoho CRM:

1. **Go to Zoho CRM** → **Setup** → **Customization** → **Modules and Fields**
2. **Select Contacts module**
3. **Add custom fields**:
   - Field 1: "User ID" (Single Line)
   - Field 2: "Signup Date" (Date)
   - Field 3: "Trial Status" (Single Line)

### Lead Status Management

Update lead statuses in Zoho CRM:
- **Not Contacted** → Initial status
- **Contacted** → After first outreach
- **Qualified** → After qualification
- **Converted** → After subscription

## 📈 Benefits

### For Sales Team
- **Automatic lead capture** from website signups
- **Complete user information** in one place
- **Lead source tracking** for attribution
- **Trial status monitoring** for follow-up

### For Marketing
- **Lead quality assessment** based on signup data
- **Campaign attribution** through lead sources
- **User journey tracking** from signup to conversion
- **Segmentation** based on trial status

## 🚨 Troubleshooting

### Common Issues

1. **"Zoho CRM not configured"**
   - Check environment variables are set
   - Verify all 5 variables are present
   - Redeploy after adding variables

2. **"Failed to get Zoho access token"**
   - Check refresh token is valid
   - Verify client ID and secret are correct
   - Ensure redirect URI matches exactly

3. **"Contact already exists"**
   - This is normal - prevents duplicates
   - Check Zoho CRM for existing contact
   - Contact will be updated if found

4. **"Zoho API error"**
   - Check API permissions in Zoho
   - Verify API domain is correct
   - Check rate limits

### Debug Endpoints

- `/test-zoho` - Test contact creation
- `/api/zoho/create-contact` - API endpoint
- Check Vercel function logs for detailed errors

## 💰 Cost Considerations

### Zoho CRM API Limits
- **Free Plan**: 1,000 API calls/month
- **Professional**: 10,000 API calls/month
- **Enterprise**: 50,000 API calls/month

### Usage Estimate
- Contact creation: ~1 call per signup
- Contact updates: ~1 call per profile change
- Search operations: ~1 call per duplicate check

**Estimated usage**: ~100-500 calls/month for typical SaaS

## 🔒 Security

### Data Protection
- **No sensitive data** stored in environment variables
- **Refresh tokens** are securely managed
- **API calls** use HTTPS encryption
- **User data** is only sent to Zoho CRM

### Access Control
- **API credentials** are environment-specific
- **Refresh tokens** can be revoked anytime
- **Contact creation** requires user authentication
- **Error handling** prevents data leaks

## 🎯 Next Steps

1. **Set up Zoho CRM API credentials**
2. **Add environment variables to Vercel**
3. **Run database migration**
4. **Test the integration**
5. **Monitor contact creation**
6. **Set up lead management workflows**

Your Zoho CRM integration is now ready to automatically capture and manage leads from Truleado signups! 🚀
