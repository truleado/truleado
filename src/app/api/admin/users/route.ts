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

    // Get all profiles first
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        updated_at,
        subscription_status,
        subscription_plan
      `)
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: profilesError.message },
        { status: 500 }
      )
    }

    // If no profiles exist, create them for existing auth users
    if (!profiles || profiles.length === 0) {
      // Try to get auth users (this might fail due to permissions)
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000
        })

        if (!authError && authUsers?.users) {
          // Create profiles for auth users
          const profilesToCreate = authUsers.users.map(user => ({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            subscription_status: 'free',
            subscription_plan: 'free',
            created_at: user.created_at,
            updated_at: user.updated_at
          }))

          const { data: newProfiles, error: createError } = await supabase
            .from('profiles')
            .insert(profilesToCreate)
            .select()

          if (createError) {
            console.error('Error creating profiles:', createError)
          } else {
            console.log('Created profiles for auth users:', newProfiles?.length)
            return NextResponse.json(newProfiles || [])
          }
        }
      } catch (error) {
        console.error('Error accessing auth users:', error)
      }

      return NextResponse.json([])
    }

    // Get user IDs for other data
    const userIds = profiles.map(p => p.id)

    // Get products data for each user
    const { data: productsData } = await supabase
      .from('products')
      .select('user_id, id, name, description, website_url, status, created_at, subreddits')
      .in('user_id', userIds)

    // Get leads count for each user
    const { data: leadsData } = await supabase
      .from('leads')
      .select('user_id, created_at')
      .in('user_id', userIds)


    // Get subscriptions data
    const { data: subscriptionsData } = await supabase
      .from('subscriptions')
      .select('user_id, status, created_at, razorpay_plan_id')
      .in('user_id', userIds)

    // Process users data
    const processedUsers = profiles.map(user => {
      const userProducts = productsData?.filter(p => p.user_id === user.id) || []
      const productsCount = userProducts.length
      const leadsCount = leadsData?.filter(l => l.user_id === user.id).length || 0
      const userSubscription = subscriptionsData?.find(s => s.user_id === user.id)

      // Calculate total leads
      const totalLeads = leadsCount
      
      // Calculate revenue based on subscription status
      const totalRevenue = user.subscription_status === 'active' || userSubscription?.status === 'active' ? 2900 : 0
      
      // Determine if user is active
      const isActive = user.subscription_status === 'active' || userSubscription?.status === 'active'

      // Get last activity date
      const lastActivity = Math.max(
        new Date(user.updated_at || user.created_at).getTime(),
        leadsCount > 0 ? Math.max(...leadsData?.filter(l => l.user_id === user.id).map(l => new Date(l.created_at || 0).getTime()) || [0]) : 0
      )

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name || 'No Name',
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
        subscription_status: user.subscription_status || userSubscription?.status || 'free',
        subscription_plan: user.subscription_plan || 'free',
        products_count: productsCount,
        leads_count: totalLeads,
        traditional_leads: leadsCount,
        total_revenue: totalRevenue,
        is_active: isActive,
        products: userProducts.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          website_url: product.website_url,
          status: product.status,
          created_at: product.created_at,
          subreddits: product.subreddits || []
        }))
      }
    })

    return NextResponse.json(processedUsers)

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}