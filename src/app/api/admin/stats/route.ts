export const dynamic = 'force-dynamic';
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


    // Calculate total leads
    const totalLeadsCount = totalLeads || 0
    const leadsThisMonthCount = leadsThisMonth || 0

    // Get revenue data from subscriptions
    const { data: revenueData } = await supabase
      .from('subscriptions')
      .select('created_at, status, razorpay_plan_id')

    // Calculate revenue based on plan (assuming $29/month for pro)
    const totalRevenue = revenueData?.filter(sub => sub.status === 'active').length * 2900 || 0

    const revenueThisMonth = revenueData?.filter(sub => {
      const subDate = new Date(sub.created_at)
      return subDate >= monthAgo && sub.status === 'active'
    }).length * 2900 || 0

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
