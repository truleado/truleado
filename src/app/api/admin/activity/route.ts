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

    // Get recent subscriptions
    const { data: recentSubscriptions } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        razorpay_plan_id,
        created_at,
        profiles!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get recent products
    const { data: recentProducts } = await supabase
      .from('products')
      .select(`
        id,
        name,
        created_at,
        profiles!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get recent leads
    const { data: recentLeads } = await supabase
      .from('leads')
      .select(`
        id,
        title,
        subreddit,
        author,
        status,
        created_at,
        profiles!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(20)


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
      activities.push({
        id: `sub-${sub.id}`,
        type: 'subscription',
        user_email: sub.profiles.email,
        description: `Subscribed to ${sub.razorpay_plan_id || 'pro'} plan`,
        created_at: sub.created_at
      })
    })

    // Add products
    recentProducts?.forEach(product => {
      activities.push({
        id: `product-${product.id}`,
        type: 'product_added',
        user_email: product.profiles.email,
        description: `Added product: ${product.name}`,
        created_at: product.created_at
      })
    })

    // Add leads
    recentLeads?.forEach(lead => {
      activities.push({
        id: `lead-${lead.id}`,
        type: 'lead_generated',
        user_email: lead.profiles.email,
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
