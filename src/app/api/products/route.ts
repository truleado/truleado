import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
        }])

      if (createError) {
        console.error('Failed to create profile:', createError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
    } else if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Failed to verify user profile' }, { status: 500 })
    }

    const productData = await request.json()
    
    // Validate required fields
    if (!productData.name || !productData.website) {
      return NextResponse.json({ error: 'Product name and website are required' }, { status: 400 })
    }

    // Prepare product data for database
    const product = {
      user_id: user.id,
      name: productData.name,
      description: productData.description || '',
      website_url: productData.website,
      features: productData.features || [],
      benefits: productData.benefits || [],
      pain_points: productData.painPoints || [],
      ideal_customer_profile: productData.idealCustomerProfile || '',
      subreddits: productData.subreddits || [],
      status: 'active',
    }

    // Insert product into database
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    // Check if Reddit account is connected before starting lead discovery
    let leadDiscoveryStarted = false
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: apiKeys, error: apiKeysError } = await supabase
        .from('api_keys')
        .select('reddit_access_token')
        .eq('user_id', user.id)
        .single()

      console.log(`Reddit connection check for user ${user.id}:`, { apiKeys, apiKeysError })

      if (apiKeysError || !apiKeys?.reddit_access_token) {
        console.log(`Reddit account not connected for user ${user.id}. Lead discovery will start after Reddit connection.`)
        leadDiscoveryStarted = false
      } else {
        // Automatically start lead discovery for the new product
        const { getJobScheduler } = await import('@/lib/job-scheduler')
        const jobScheduler = getJobScheduler()
        await jobScheduler.createJob(user.id, data.id, 'reddit_monitoring', 60)
        console.log(`Auto-started lead discovery for product: ${data.name}`)
        leadDiscoveryStarted = true
      }
    } catch (jobError) {
      console.error('Failed to auto-start lead discovery:', jobError)
      leadDiscoveryStarted = false
      // Don't fail the product creation if job creation fails
    }

    return NextResponse.json({ 
      success: true, 
      product: data,
      leadDiscoveryStarted
    })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
