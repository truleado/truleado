// Using built-in fetch (Node.js 18+)

async function testChatFindAPI() {
  console.log('🔍 Testing Chat & Find API endpoints...\n');
  
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test 1: Check if search API is working
    console.log('1. Testing search API...');
    const searchResponse = await fetch(`${baseUrl}/api/chat-find/search-leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'looking for project management software'
      })
    });
    
    console.log('Search API Status:', searchResponse.status);
    const searchData = await searchResponse.text();
    console.log('Search API Response:', searchData.substring(0, 500));
    
    if (searchResponse.ok) {
      const searchResult = JSON.parse(searchData);
      console.log('Search ID:', searchResult.searchId);
      
      // Test 2: Check progress API
      console.log('\n2. Testing progress API...');
      const progressResponse = await fetch(`${baseUrl}/api/chat-find/progress?searchId=${searchResult.searchId}`);
      console.log('Progress API Status:', progressResponse.status);
      const progressData = await progressResponse.text();
      console.log('Progress API Response:', progressData);
      
      // Test 3: Check results API
      console.log('\n3. Testing results API...');
      const resultsResponse = await fetch(`${baseUrl}/api/chat-find/results?searchId=${searchResult.searchId}`);
      console.log('Results API Status:', resultsResponse.status);
      const resultsData = await resultsResponse.text();
      console.log('Results API Response:', resultsData.substring(0, 500));
      
      // Test 4: Check history API
      console.log('\n4. Testing history API...');
      const historyResponse = await fetch(`${baseUrl}/api/chat-find/history`);
      console.log('History API Status:', historyResponse.status);
      const historyData = await historyResponse.text();
      console.log('History API Response:', historyData.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testChatFindAPI();
