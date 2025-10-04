// Manual test script to trigger lead discovery
const fetch = require('node-fetch');

async function testLeadDiscovery() {
  try {
    console.log('Testing lead discovery...');
    
    // First, let's check the job scheduler status
    const statusResponse = await fetch('http://localhost:3001/api/debug/job-scheduler-status');
    const statusData = await statusResponse.json();
    console.log('Job Scheduler Status:', statusData);
    
    // Check database status (this will require authentication)
    console.log('\nTo check database status, please:');
    console.log('1. Open http://localhost:3001/api/debug/database-status in your browser');
    console.log('2. Make sure you are logged in');
    console.log('3. Check if you have products and Reddit connection');
    
    // Check if there are any recent leads
    console.log('\nTo check for leads:');
    console.log('1. Open http://localhost:3001/leads in your browser');
    console.log('2. Check if any leads are displayed');
    
    // Manual trigger instructions
    console.log('\nTo manually trigger lead discovery:');
    console.log('1. Go to http://localhost:3001/products');
    console.log('2. Make sure you have a product with subreddits configured');
    console.log('3. Make sure Reddit is connected');
    console.log('4. The system should automatically start lead discovery');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLeadDiscovery();
