import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        updated_at,
        subscription_status,
        subscription_plan,
      `)
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        website_url,
        status,
        created_at,
        subreddits
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (productsError) {
      console.error('Error fetching products:', productsError)
    }

    // Get leads count
    const { data: leadsData } = await supabase
      .from('leads')
      .select('id, created_at')
      .eq('user_id', userId)


    // Get subscription data
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('status, created_at, razorpay_plan_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    const leadsCount = leadsData?.length || 0
    const totalLeads = leadsCount

    // Calculate revenue
    const totalRevenue = user.subscription_status === 'active' || subscriptionData?.[0]?.status === 'active' ? 2900 : 0

    // Calculate last activity
    const lastActivity = Math.max(
      new Date(user.updated_at || user.created_at).getTime(),
      leadsCount > 0 ? Math.max(...leadsData?.map(l => new Date(l.created_at).getTime()) || [0]) : 0
    )

    const userDetails = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
      subscription_status: user.subscription_status || subscriptionData?.[0]?.status || 'inactive',
      subscription_plan: user.subscription_plan || 'free',
      products_count: products?.length || 0,
      leads_count: totalLeads,
      traditional_leads: leadsCount,
      total_revenue: totalRevenue,
      is_active: user.subscription_status === 'active' || subscriptionData?.[0]?.status === 'active',
      products: products || []
    }

    return NextResponse.json(userDetails)

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json({
      error: 'Failed to fetch user details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
