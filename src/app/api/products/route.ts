import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Try to get authenticated user first
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Products API auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })

    // Require authentication - no fallback for security
    if (!user) {
      console.error('No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Filter products by authenticated user
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    console.log('Products query result:', { productsCount: products?.length || 0, error: error?.message })
    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Product creation API called')
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth check:', { user: user?.id, authError })
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
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
    console.log('Product data received:', { name: productData.name, website: productData.website })
    
    // Validate required fields
    if (!productData.name || !productData.website) {
      console.error('Validation failed:', { name: productData.name, website: productData.website })
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
    console.log('Inserting product:', product)
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create product', details: error.message }, { status: 500 })
    }
    
    console.log('Product created successfully:', data)

    // Start lead discovery asynchronously (don't wait for it)
    setImmediate(async () => {
      try {
        const { getJobScheduler } = await import('@/lib/job-scheduler')
        const jobScheduler = getJobScheduler()
        
        await jobScheduler.createJob(user.id, data.id, 'reddit_monitoring', 60)
        console.log(`✅ Started lead discovery for product: ${data.name}`)
      } catch (jobError) {
        console.error(`❌ Failed to start lead discovery for product ${data.name}:`, jobError)
        // Don't fail product creation if lead discovery fails
      }
    })

    return NextResponse.json({ 
      success: true, 
      product: data,
      message: 'Product created successfully. Lead discovery is starting in the background.'
    })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
