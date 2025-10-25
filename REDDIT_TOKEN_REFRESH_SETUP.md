# Reddit Token Refresh Setup

This document explains how to set up automatic Reddit token refresh to prevent daily disconnections.

## Problem

Reddit OAuth tokens expire after 24 hours, causing users to reconnect their Reddit accounts daily. This creates a poor user experience.

## Solution

We've implemented an automatic token refresh system that:

1. **Proactively refreshes tokens** before they expire
2. **Automatically attempts refresh** when checking connection status
3. **Provides bulk refresh** for all users
4. **Cleans up invalid tokens** when refresh fails

## Setup Instructions

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Required for token refresh
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Your production URL
ADMIN_REFRESH_KEY=your-secret-admin-key     # Generate a secure random string
```

### 2. Generate Admin Key

Generate a secure admin key:

```bash
# Generate a random 32-character key
openssl rand -hex 32
```

### 3. Set Up Cron Job (Recommended)

Add this to your server's crontab to run every 6 hours:

```bash
# Edit crontab
crontab -e

# Add this line (replace with your actual paths and admin key)
0 */6 * * * cd /path/to/your/app && ADMIN_REFRESH_KEY=your-admin-key node scripts/refresh-reddit-tokens.js >> /var/log/reddit-token-refresh.log 2>&1
```

### 4. Alternative: Manual Refresh

You can manually refresh tokens by calling the API:

```bash
curl -X POST https://yourdomain.com/api/auth/reddit/refresh-all \
  -H "x-admin-key: your-admin-key"
```

## How It Works

### Automatic Refresh on Status Check

When any page checks Reddit connection status (`/api/auth/reddit/status`), the system:

1. Checks if the token is expired
2. If expired and refresh token exists, automatically attempts refresh
3. Updates the database with new tokens
4. Returns the updated connection status

### Proactive Bulk Refresh

The cron job (`scripts/refresh-reddit-tokens.js`):

1. Finds all users with tokens expiring within 1 hour
2. Attempts to refresh each token
3. Clears invalid tokens from the database
4. Logs results for monitoring

### Token Cleanup

When refresh fails (e.g., user revoked access), the system:

1. Clears all Reddit tokens from the database
2. User will need to reconnect their Reddit account
3. Prevents repeated failed refresh attempts

## Monitoring

### Check Refresh Logs

```bash
# View recent refresh activity
tail -f /var/log/reddit-token-refresh.log
```

### Test Manual Refresh

```bash
# Test the refresh system
node scripts/refresh-reddit-tokens.js
```

### Check API Status

```bash
# Check if refresh endpoint is working
curl -X POST https://yourdomain.com/api/auth/reddit/refresh-all \
  -H "x-admin-key: your-admin-key" \
  -H "Content-Type: application/json"
```

## Troubleshooting

### Common Issues

1. **"ADMIN_REFRESH_KEY environment variable is required"**
   - Make sure you've set the `ADMIN_REFRESH_KEY` in your environment

2. **"Reddit OAuth credentials not configured"**
   - Ensure `REDDIT_OAUTH_CLIENT_ID` and `REDDIT_OAUTH_CLIENT_SECRET` are set

3. **"Token refresh failed: HTTP 401"**
   - The refresh token may be invalid (user revoked access)
   - This is normal and tokens will be cleaned up automatically

4. **Cron job not running**
   - Check cron service is running: `systemctl status cron`
   - Check cron logs: `journalctl -u cron`
   - Verify the script path and permissions

### Debug Mode

To see detailed logs, check your application logs:

```bash
# For PM2
pm2 logs your-app-name

# For Docker
docker logs your-container-name

# For systemd
journalctl -u your-service-name
```

## Benefits

- ✅ **No more daily reconnections** - Tokens refresh automatically
- ✅ **Better user experience** - Seamless Reddit integration
- ✅ **Reduced support tickets** - Fewer "Reddit disconnected" issues
- ✅ **Automatic cleanup** - Invalid tokens are removed automatically
- ✅ **Monitoring** - Detailed logs for troubleshooting

## Security Notes

- The `ADMIN_REFRESH_KEY` should be kept secret
- Only use it for server-to-server communication
- Consider rotating the key periodically
- Monitor logs for any unauthorized access attempts
