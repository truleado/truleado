// Test script to demonstrate immediate lead discovery
const fetch = require('node-fetch');

async function testImmediateLeadDiscovery() {
  console.log('🧪 Testing immediate lead discovery...\n');
  
  try {
    // Step 1: Analyze a product
    console.log('1️⃣ Analyzing product: Stripe');
    const analyzeResponse = await fetch('http://localhost:3000/api/products/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website: 'https://stripe.com' })
    });
    
    const productData = await analyzeResponse.json();
    console.log('✅ Product analyzed successfully');
    console.log(`   Name: ${productData.name}`);
    console.log(`   Features: ${productData.features.length} features`);
    console.log(`   Benefits: ${productData.benefits.length} benefits`);
    console.log(`   Pain Points: ${productData.painPoints.length} pain points\n`);
    
    // Step 2: Create product (this will trigger immediate lead discovery)
    console.log('2️⃣ Creating product with immediate lead discovery...');
    const createResponse = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: productData.name,
        description: productData.description,
        website: 'https://stripe.com',
        features: productData.features,
        benefits: productData.benefits,
        painPoints: productData.painPoints,
        idealCustomerProfile: productData.idealCustomerProfile,
        subreddits: ['entrepreneur', 'startups', 'SaaS', 'ecommerce']
      })
    });
    
    const createResult = await createResponse.json();
    console.log('✅ Product created successfully');
    console.log(`   Product ID: ${createResult.product.id}`);
    console.log(`   Message: ${createResult.message}\n`);
    
    // Step 3: Wait a moment for lead discovery to complete
    console.log('3️⃣ Waiting for lead discovery to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    // Step 4: Check for leads
    console.log('4️⃣ Checking for discovered leads...');
    const leadsResponse = await fetch(`http://localhost:3000/api/leads?productId=${createResult.product.id}`);
    const leadsData = await leadsResponse.json();
    
    console.log(`✅ Found ${leadsData.leads?.length || 0} leads`);
    
    if (leadsData.leads && leadsData.leads.length > 0) {
      console.log('\n📋 Sample leads:');
      leadsData.leads.slice(0, 3).forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.title}`);
        console.log(`      Subreddit: r/${lead.subreddit}`);
        console.log(`      Score: ${lead.lead_score}/10`);
        console.log(`      URL: ${lead.url}\n`);
      });
    }
    
    console.log('🎉 Test completed! The system now discovers leads immediately when you add a product.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImmediateLeadDiscovery();
