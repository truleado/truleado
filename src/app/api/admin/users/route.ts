import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get users with their subscription and activity data
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        created_at,
        subscription_status,
        subscription_plan
      `)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      )
    }

    // Get products count for each user
    const { data: productsData } = await supabase
      .from('products')
      .select('user_id')
      .in('user_id', users?.map(u => u.id) || [])

    // Get leads count for each user
    const { data: leadsData } = await supabase
      .from('leads')
      .select('user_id')
      .in('user_id', users?.map(u => u.id) || [])

    // Get chat find leads count for each user
    const { data: chatFindSearches } = await supabase
      .from('chat_find_searches')
      .select('user_id, id')
      .in('user_id', users?.map(u => u.id) || [])

    const { data: chatFindLeads } = await supabase
      .from('chat_find_results')
      .select('search_id')
      .in('search_id', chatFindSearches?.map(s => s.id) || [])

    // Process users data
    const processedUsers = users?.map(user => {
      const productsCount = productsData?.filter(p => p.user_id === user.id).length || 0
      const leadsCount = leadsData?.filter(l => l.user_id === user.id).length || 0
      const userChatFindSearches = chatFindSearches?.filter(s => s.user_id === user.id) || []
      const userChatFindLeads = chatFindLeads?.filter(l => 
        userChatFindSearches.some(s => s.id === l.search_id)
      ).length || 0

      const totalLeads = leadsCount + userChatFindLeads
      const totalRevenue = user.subscription_status === 'active' ? 2900 : 0 // $29/month for pro plan
      const isActive = user.subscription_status === 'active'

      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: null, // Not available in profiles table
        subscription_status: user.subscription_status || 'inactive',
        subscription_plan: user.subscription_plan || 'free',
        products_count: productsCount,
        leads_count: totalLeads,
        total_revenue: totalRevenue,
        is_active: isActive
      }
    }) || []

    return NextResponse.json(processedUsers)

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
