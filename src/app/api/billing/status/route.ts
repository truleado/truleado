export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at, paddle_subscription_id, paddle_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching subscription status:', profileError)
      return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 })
    }

    return NextResponse.json({
      subscription_status: profile?.subscription_status || 'pending',
      trial_ends_at: profile?.trial_ends_at || null,
      subscription_ends_at: profile?.subscription_ends_at || null,
      paddle_subscription_id: profile?.paddle_subscription_id || null,
      paddle_customer_id: profile?.paddle_customer_id || null
    })
  } catch (error) {
    console.error('Billing status error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

