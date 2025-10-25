// Manual Lead Discovery Script
// Run this in your browser console while logged into the app

async function scanExistingProductsForLeads() {
    console.log('🔍 Starting manual lead discovery for existing products...');
    
    try {
        // Get current products
        const productsResponse = await fetch('/api/products');
        const productsData = await productsResponse.json();
        
        if (productsData.error) {
            console.error('Error fetching products:', productsData.error);
            return;
        }
        
        console.log(`Found ${productsData.products?.length || 0} products:`, productsData.products);
        
        // Scan for leads
        const leadsResponse = await fetch('/api/debug/scan-existing-products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const leadsData = await leadsResponse.json();
        
        if (leadsData.error) {
            console.error('Error scanning leads:', leadsData.error);
            return;
        }
        
        console.log('🎉 Lead discovery results:', leadsData);
        
        if (leadsData.totalLeads > 0) {
            console.log(`✅ Found ${leadsData.totalLeads} leads!`);
            console.log('Sample leads:', leadsData.sampleLeads);
        } else {
            console.log('😔 No leads found. This might be because:');
            console.log('1. Reddit API is still being blocked');
            console.log('2. Search terms are too specific');
            console.log('3. AI analysis is too strict');
        }
        
        return leadsData;
        
    } catch (error) {
        console.error('❌ Error during lead discovery:', error);
    }
}

// Run the function
scanExistingProductsForLeads();
