// Test Zoho CRM integration locally
const fetch = require('node-fetch').default;

async function testZohoIntegration() {
  try {
    console.log('🧪 Testing Zoho CRM Integration...\n');
    
    // Test 1: Check if we can get an access token
    console.log('1️⃣ Testing access token generation...');
    
    const tokenResponse = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: '1000.82DRWH7GU91XIPF7ZN9Q3W9KZ770GY',
        client_secret: '30c61a291d791a0d1caa6e2ce193d069be007d6ea9',
        refresh_token: '1000.1aa3bd63937b5fb65d8e970165babc99.4df927f0368af5b8807bea0ee715c8cb',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log('❌ Token generation failed:', errorText);
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Access token generated successfully');
    console.log('   Token expires in:', tokenData.expires_in, 'seconds\n');

    // Test 2: Create a test contact
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

    const contactResponse = await fetch('https://www.zohoapis.in/crm/v2/Contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [contactData]
      }),
    });

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.log('❌ Contact creation failed:', errorText);
      return;
    }

    const contactResult = await contactResponse.json();
    console.log('✅ Contact created successfully!');
    console.log('   Contact ID:', contactResult.data[0].details?.id);
    console.log('   Contact Name:', contactResult.data[0].First_Name, contactResult.data[0].Last_Name);
    console.log('   Contact Email:', contactResult.data[0].Email);
    
    console.log('\n🎉 Zoho CRM integration is working perfectly!');
    console.log('   You can now add the environment variables to Vercel and deploy.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testZohoIntegration();
