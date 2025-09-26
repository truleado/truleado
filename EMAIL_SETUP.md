# Email System Setup Guide

This guide will help you set up automated email functionality for Truleado using Resend.

## 🚀 Quick Setup

### 1. Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free)
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

### 2. Add Environment Variables

Add to your `.env.local` file:

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx

# Optional: For cron job security
CRON_SECRET=your-secret-key-here
```

### 3. Run Database Migration

Execute the SQL migration to add email tracking columns:

```sql
-- Run this in your Supabase SQL editor
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_reminder_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_email_tracking 
ON profiles (welcome_email_sent, trial_reminder_sent);
```

### 4. Set Up Supabase Webhook (Optional)

For Google OAuth signups, set up a webhook:

1. Go to Supabase Dashboard → Database → Webhooks
2. Create new webhook
3. Table: `auth.users`
4. Events: `INSERT`
5. URL: `https://yourdomain.com/api/webhooks/supabase-auth`
6. HTTP Method: `POST`

## 📧 Email Features

### Welcome Email
- **Trigger**: User signs up (email/password or Google OAuth)
- **Content**: Welcome message, trial info, getting started guide
- **Template**: Beautiful HTML with SF Pro font
- **Frequency**: Once per user

### Trial Reminder Email
- **Trigger**: 3 days before trial expires
- **Content**: Reminder to upgrade, upgrade button
- **Template**: Clean, conversion-focused design
- **Frequency**: Once per user

## 🧪 Testing

### Test Page
Visit `/test-email` to test the email system:

1. Click "Send Test Welcome Email"
2. Check your email inbox
3. Verify the email looks correct

### Manual Testing
```bash
# Test welcome email API
curl -X POST https://yourdomain.com/api/test-welcome-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test trial reminders (requires CRON_SECRET)
curl -X GET https://yourdomain.com/api/cron/send-trial-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## ⚙️ Configuration

### Email Templates
Templates are in `src/lib/email-service.ts`:
- `sendWelcomeEmail()` - Welcome email template
- `sendTrialReminder()` - Trial reminder template

### Customization
- **From Address**: Change `from: 'Truleado <onboarding@truleado.com>'`
- **Templates**: Modify HTML in the service functions
- **Timing**: Adjust trial reminder timing in cron job
- **Content**: Update email content and styling

## 🔄 Automation

### Cron Jobs
Set up a cron job to send trial reminders:

```bash
# Run every day at 9 AM
0 9 * * * curl -X GET https://yourdomain.com/api/cron/send-trial-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Vercel Cron (Recommended)
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-trial-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## 📊 Monitoring

### Logs
Check your application logs for:
- Email send success/failure
- User signup events
- Webhook processing

### Database
Monitor email tracking:
```sql
-- Check email sending status
SELECT 
  id,
  user_email,
  welcome_email_sent,
  welcome_email_sent_at,
  trial_reminder_sent,
  trial_reminder_sent_at
FROM profiles 
WHERE created_at > NOW() - INTERVAL '7 days';
```

## 🚨 Troubleshooting

### Common Issues

1. **"Email service not configured"**
   - Check `RESEND_API_KEY` is set
   - Verify API key is valid

2. **"Failed to send welcome email"**
   - Check Resend dashboard for errors
   - Verify email address is valid
   - Check API key permissions

3. **Webhook not triggering**
   - Verify webhook URL is correct
   - Check Supabase webhook configuration
   - Test webhook manually

4. **Duplicate emails**
   - Check `welcome_email_sent` flag in database
   - Verify webhook is only set for INSERT events

### Debug Endpoints

- `/api/test-welcome-email` - Test email sending
- `/api/cron/send-trial-reminders` - Test trial reminders
- `/test-email` - UI for testing

## 💰 Cost Estimation

### Resend Pricing
- **Free Tier**: 100 emails/day
- **Pro Tier**: $20/month for 50,000 emails
- **Volume**: ~$0.40 per 1,000 emails

### Usage Estimate
- Welcome emails: ~1 per signup
- Trial reminders: ~1 per trial user
- Total: ~2 emails per user

## 🔒 Security

### API Keys
- Store `RESEND_API_KEY` securely
- Use `CRON_SECRET` for cron job protection
- Rotate keys regularly

### Rate Limiting
- Resend has built-in rate limiting
- Monitor usage in Resend dashboard
- Implement additional rate limiting if needed

## 📈 Analytics

### Resend Dashboard
- Email delivery rates
- Open rates
- Click rates
- Bounce handling

### Custom Tracking
- Database flags for email status
- Timestamps for email sending
- User engagement tracking

## 🎯 Next Steps

1. **Set up Resend account**
2. **Add environment variables**
3. **Run database migration**
4. **Test email functionality**
5. **Set up cron job for reminders**
6. **Monitor and optimize**

Your email system is now ready to engage users and drive conversions! 🚀
