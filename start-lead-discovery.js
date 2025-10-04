// Script to manually start lead discovery for existing products
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function startLeadDiscovery() {
  try {
    // Use service role key for admin operations
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPreview: supabaseUrl?.substring(0, 30) + '...'
    })
    
    if (!supabaseKey || !supabaseUrl) {
      console.error('Supabase credentials not configured')
      return
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, user_id')
      .order('created_at', { ascending: false })
    
    if (productsError) {
      console.error('Error fetching products:', productsError)
      return
    }
    
    console.log(`Found ${products.length} products:`)
    products.forEach(p => console.log(`- ${p.name} (${p.id}) - User: ${p.user_id}`))
    
    // Get job scheduler
    const { getJobScheduler } = await import('./src/lib/job-scheduler.ts')
    const jobScheduler = getJobScheduler()
    
    // Start lead discovery for each product
    for (const product of products) {
      try {
        await jobScheduler.createJob(product.user_id, product.id, 'reddit_monitoring', 60)
        console.log(`✅ Started lead discovery for: ${product.name}`)
      } catch (jobError) {
        console.error(`❌ Failed to start lead discovery for ${product.name}:`, jobError.message)
      }
    }
    
    console.log('Lead discovery setup complete!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

startLeadDiscovery()
