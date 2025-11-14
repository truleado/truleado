export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Query to find users with high Gemini API usage
    const { data, error } = await supabase.rpc('get_gemini_heavy_users', {
      days_lookback: 30,
      min_calls: 10
    })

    // If RPC function doesn't exist, use direct query
    if (error && error.code === '42883') {
      // Fallback: Query products and leads directly
      const { data: productsData } = await supabase
        .from('products')
        .select('user_id, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const { data: leadsData } = await supabase
        .from('leads')
        .select('user_id, created_at')
        .not('ai_analysis', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      // Count usage per user
      const usageMap = new Map<string, { products: number; leads: number; total: number }>()

      productsData?.forEach((product: any) => {
        const current = usageMap.get(product.user_id) || { products: 0, leads: 0, total: 0 }
        current.products++
        current.total++
        usageMap.set(product.user_id, current)
      })

      leadsData?.forEach((lead: any) => {
        const current = usageMap.get(lead.user_id) || { products: 0, leads: 0, total: 0 }
        current.leads++
        current.total++
        usageMap.set(lead.user_id, current)
      })

      // Get user profiles for users with 10+ calls
      const heavyUserIds = Array.from(usageMap.entries())
        .filter(([_, usage]) => usage.total >= 10)
        .sort(([_, a], [__, b]) => b.total - a.total)
        .slice(0, 50)
        .map(([userId]) => userId)

      if (heavyUserIds.length === 0) {
        return NextResponse.json({ users: [] })
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, subscription_status')
        .in('id', heavyUserIds)

      const result = profiles?.map(profile => {
        const usage = usageMap.get(profile.id) || { products: 0, leads: 0, total: 0 }
        return {
          email: profile.email,
          full_name: profile.full_name,
          subscription_status: profile.subscription_status,
          product_analyses: usage.products,
          lead_analyses: usage.leads,
          total_calls: usage.total
        }
      }).sort((a, b) => b.total_calls - a.total_calls) || []

      // Return just user names/emails as requested
      const userNames = result.map(r => r.full_name || r.email || 'Unknown')

      return NextResponse.json({ users: userNames })
    }

    if (error) {
      console.error('Error querying heavy users:', error)
      return NextResponse.json({ error: 'Failed to query users' }, { status: 500 })
    }

    // Extract just user names/emails
    const userNames = data?.map((user: any) => user.full_name || user.email || 'Unknown') || []

    return NextResponse.json({ users: userNames })
  } catch (error) {
    console.error('Error in gemini-heavy-users endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



