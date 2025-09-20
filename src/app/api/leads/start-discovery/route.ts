import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Reddit account is connected
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token')
      .eq('user_id', user.id)
      .single()

    if (apiKeysError || !apiKeys?.reddit_access_token) {
      return NextResponse.json({ 
        error: 'Reddit account not connected. Please connect your Reddit account first.' 
      }, { status: 400 })
    }

    // Get all products for the user
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('user_id', user.id)

    if (productsError || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    if (products.length === 0) {
      return NextResponse.json({ 
        error: 'No products found. Please add a product first.' 
      }, { status: 400 })
    }

    // Start lead discovery for all products
    const { getJobScheduler } = await import('@/lib/job-scheduler')
    const jobScheduler = getJobScheduler()
    
    let jobsCreated = 0
    for (const product of products) {
      try {
        await jobScheduler.createJob(user.id, product.id, 'reddit_monitoring', 60)
        jobsCreated++
        console.log(`Started lead discovery for product: ${product.name}`)
      } catch (jobError) {
        console.error(`Failed to start lead discovery for product ${product.name}:`, jobError)
      }
    }

    return NextResponse.json({ 
      message: `Lead discovery started for ${jobsCreated} products.`,
      productsStarted: jobsCreated,
      totalProducts: products.length
    })
  } catch (error) {
    console.error('Error starting lead discovery:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to start lead discovery'
    }, { status: 500 })
  }
}
