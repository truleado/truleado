import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get new users today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: newUsersToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Get new users this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: newUsersThisWeek } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    // Get new users this month
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const { count: newUsersThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString())

    // Get subscription stats
    const { count: totalSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })

    const { count: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get products count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Get leads count
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    // Get leads this month
    const { count: leadsThisMonth } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString())

    // Get chat find leads count
    const { count: chatFindLeads } = await supabase
      .from('chat_find_results')
      .select('*', { count: 'exact', head: true })

    const { count: chatFindLeadsThisMonth } = await supabase
      .from('chat_find_results')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString())

    // Calculate total leads including chat find
    const totalLeadsCount = (totalLeads || 0) + (chatFindLeads || 0)
    const leadsThisMonthCount = (leadsThisMonth || 0) + (chatFindLeadsThisMonth || 0)

    // Get revenue data
    const { data: revenueData } = await supabase
      .from('subscriptions')
      .select('amount, created_at, status')

    const totalRevenue = revenueData?.reduce((sum, sub) => {
      if (sub.status === 'active') {
        return sum + (sub.amount || 0)
      }
      return sum
    }, 0) || 0

    const revenueThisMonth = revenueData?.filter(sub => {
      const subDate = new Date(sub.created_at)
      return subDate >= monthAgo && sub.status === 'active'
    }).reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0

    // Calculate metrics
    const averageLeadsPerUser = totalUsers && totalUsers > 0 ? totalLeadsCount / totalUsers : 0
    const conversionRate = totalUsers && totalUsers > 0 ? ((activeSubscriptions || 0) / totalUsers) * 100 : 0

    const stats = {
      totalUsers: totalUsers || 0,
      newUsersToday: newUsersToday || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      totalSubscriptions: totalSubscriptions || 0,
      activeSubscriptions: activeSubscriptions || 0,
      totalProducts: totalProducts || 0,
      totalLeads: totalLeadsCount,
      leadsThisMonth: leadsThisMonthCount,
      totalRevenue,
      revenueThisMonth,
      averageLeadsPerUser,
      conversionRate
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}
