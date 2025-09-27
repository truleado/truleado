// Standalone Zoho CRM test - no dependencies
const https = require('https');

async function testZohoStandalone() {
  try {
    console.log('🧪 Testing Zoho CRM Integration (Standalone)...\n');
    
    // Your Zoho credentials
    const clientId = '1000.82DRWH7GU91XIPF7ZN9Q3W9KZ770GY';
    const clientSecret = '30c61a291d791a0d1caa6e2ce193d069be007d6ea9';
    const refreshToken = 'YOUR_NEW_REFRESH_TOKEN_HERE'; // Replace this with your actual refresh token
    
    console.log('1️⃣ Testing access token generation...');
    
    // Step 1: Get access token
    const tokenData = await new Promise((resolve, reject) => {
      const postData = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }).toString();

      const options = {
        hostname: 'accounts.zoho.com',
        port: 443,
        path: '/oauth/v2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.error) {
              reject(new Error(result.error));
            } else {
              resolve(result);
            }
          } catch (e) {
            reject(new Error('Invalid JSON response: ' + data));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('✅ Access token generated successfully');
    console.log('   Token expires in:', tokenData.expires_in, 'seconds\n');

    // Step 2: Create contact
    console.log('2️⃣ Testing contact creation...');
    
    const contactData = {
      First_Name: 'Test',
      Last_Name: 'User',
      Email: 'test@truleado.com',
      Phone: '+1234567890',
      Lead_Source: 'Truleado Website',
      Lead_Status: 'Not Contacted',
      Company: 'Test Company',
      Description: 'Test contact from Truleado integration',
      Custom_Field_1: 'test-user-123',
      Custom_Field_2: new Date().toISOString(),
      Custom_Field_3: 'trial'
    };

    const contactResult = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({ data: [contactData] });

      const options = {
        hostname: 'www.zohoapis.com',
        port: 443,
        path: '/crm/v2/Contacts',
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            } else {
              resolve(result);
            }
          } catch (e) {
            reject(new Error('Invalid JSON response: ' + data));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('✅ Contact created successfully!');
    console.log('   Contact ID:', contactResult.data[0].details?.id);
    console.log('   Contact Name:', contactResult.data[0].First_Name, contactResult.data[0].Last_Name);
    console.log('   Contact Email:', contactResult.data[0].Email);
    
    console.log('\n🎉 Zoho CRM integration is working perfectly!');
    console.log('   Your refresh token is valid and has the correct permissions.');
    console.log('   You can now add it to Vercel environment variables.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure you replaced YOUR_NEW_REFRESH_TOKEN_HERE with your actual token');
    console.log('   2. Check that your refresh token has ZohoCRM.modules.ALL scope');
    console.log('   3. Verify your client ID and secret are correct');
  }
}

testZohoStandalone();
