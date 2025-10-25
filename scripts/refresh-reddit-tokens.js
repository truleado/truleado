#!/usr/bin/env node

/**
 * Reddit Token Refresh Script
 * 
 * This script refreshes Reddit tokens for all users whose tokens are about to expire.
 * It can be run as a cron job to prevent token disconnections.
 * 
 * Usage:
 *   node scripts/refresh-reddit-tokens.js
 * 
 * Environment variables required:
 *   - NEXT_PUBLIC_APP_URL: Your app's URL (e.g., https://yourdomain.com)
 *   - ADMIN_REFRESH_KEY: Secret key for authentication
 */

const https = require('https');
const http = require('http');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_KEY = process.env.ADMIN_REFRESH_KEY;

if (!ADMIN_KEY) {
  console.error('❌ ADMIN_REFRESH_KEY environment variable is required');
  process.exit(1);
}

async function refreshTokens() {
  try {
    console.log('🔄 Starting Reddit token refresh...');
    console.log(`📡 Calling: ${APP_URL}/api/auth/reddit/refresh-all`);
    
    const url = new URL(`${APP_URL}/api/auth/reddit/refresh-all`);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Token refresh completed successfully');
            console.log(`📊 Results: ${result.refreshed} refreshed, ${result.failed} failed, ${result.total} total`);
            
            if (result.results && result.results.length > 0) {
              console.log('\n📋 Detailed results:');
              result.results.forEach((r, i) => {
                const status = r.success ? '✅' : '❌';
                const error = r.error ? ` (${r.error})` : '';
                console.log(`  ${i + 1}. User ${r.userId}: ${status}${error}`);
              });
            }
          } else {
            console.error('❌ Token refresh failed:', result.error || 'Unknown error');
            process.exit(1);
          }
        } catch (parseError) {
          console.error('❌ Failed to parse response:', parseError.message);
          console.error('Raw response:', data);
          process.exit(1);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      process.exit(1);
    });

    req.end();
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    process.exit(1);
  }
}

// Run the refresh
refreshTokens();
