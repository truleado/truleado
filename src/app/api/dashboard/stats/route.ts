export const dynamic = 'force-dynamic';
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

    const userId = user.id

    // Get total leads count
    const { count: totalLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (leadsError) {
      console.error('Error fetching total leads:', leadsError)
    }

    // Get active products count
    const { count: activeProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (productsError) {
      console.error('Error fetching active products:', productsError)
    }

    // Get subreddits monitored (from products)
    const { data: products, error: productsDataError } = await supabase
      .from('products')
      .select('subreddits')
      .eq('user_id', userId)

    let subredditsMonitored = 0
    if (!productsDataError && products) {
      products.forEach((product: any) => {
        if (product.subreddits && Array.isArray(product.subreddits)) {
          subredditsMonitored += product.subreddits.length
        }
      })
    }

    // Get leads this week
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const { count: leadsThisWeek, error: weekLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfWeek.toISOString())

    if (weekLeadsError) {
      console.error('Error fetching weekly leads:', weekLeadsError)
    }

    // Get leads today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { count: leadsToday, error: todayLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())

    if (todayLeadsError) {
      console.error('Error fetching today leads:', todayLeadsError)
    }

    const stats = {
      totalLeads: totalLeads || 0,
      activeProducts: activeProducts || 0,
      subredditsMonitored,
      leadsThisWeek: leadsThisWeek || 0,
      leadsToday: leadsToday || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
    }, { status: 500 })
  }
}
