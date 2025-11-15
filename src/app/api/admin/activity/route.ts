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

    // Get recent user signups
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get recent subscriptions with user emails
    const { data: recentSubscriptions } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        status,
        razorpay_plan_id,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get user emails for subscriptions
    const subscriptionUserIds = recentSubscriptions?.map(s => s.user_id).filter(Boolean) || []
    let subscriptionUsers: any[] = []
    if (subscriptionUserIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', subscriptionUserIds)
      subscriptionUsers = data || []
    }

    // Get recent products with user emails
    const { data: recentProducts } = await supabase
      .from('products')
      .select(`
        id,
        user_id,
        name,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get user emails for products
    const productUserIds = recentProducts?.map(p => p.user_id).filter(Boolean) || []
    let productUsers: any[] = []
    if (productUserIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', productUserIds)
      productUsers = data || []
    }

    // Get recent leads with user emails
    const { data: recentLeads } = await supabase
      .from('leads')
      .select(`
        id,
        user_id,
        title,
        subreddit,
        author,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get user emails for leads
    const leadUserIds = recentLeads?.map(l => l.user_id).filter(Boolean) || []
    let leadUsers: any[] = []
    if (leadUserIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', leadUserIds)
      leadUsers = data || []
    }


    // Combine all activities
    const activities = []

    // Add user signups
    recentUsers?.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'signup',
        user_email: user.email,
        description: 'New user signed up',
        created_at: user.created_at
      })
    })

    // Add subscriptions
    recentSubscriptions?.forEach(sub => {
      const user = subscriptionUsers.find(u => u.id === sub.user_id)
      activities.push({
        id: `sub-${sub.id}`,
        type: 'subscription',
        user_email: user?.email || 'Unknown',
        description: `Subscribed to ${sub.razorpay_plan_id || 'pro'} plan`,
        created_at: sub.created_at
      })
    })

    // Add products
    recentProducts?.forEach(product => {
      const user = productUsers.find(u => u.id === product.user_id)
      activities.push({
        id: `product-${product.id}`,
        type: 'product_added',
        user_email: user?.email || 'Unknown',
        description: `Added product: ${product.name}`,
        created_at: product.created_at
      })
    })

    // Add leads
    recentLeads?.forEach(lead => {
      const user = leadUsers.find(u => u.id === lead.user_id)
      activities.push({
        id: `lead-${lead.id}`,
        type: 'lead_generated',
        user_email: user?.email || 'Unknown',
        description: `Generated lead: ${lead.title} (r/${lead.subreddit} by u/${lead.author})`,
        created_at: lead.created_at
      })
    })


    // Sort by date and return most recent
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(activities.slice(0, 50)) // Return last 50 activities

  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
