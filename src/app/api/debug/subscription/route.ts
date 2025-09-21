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

    // Get user's subscription details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_ends_at, razorpay_subscription_id, razorpay_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      subscription_status: profile.subscription_status || 'free',
      subscription_ends_at: profile.subscription_ends_at,
      razorpay_subscription_id: profile.razorpay_subscription_id,
      razorpay_customer_id: profile.razorpay_customer_id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Subscription debug error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Debug failed'
    }, { status: 500 })
  }
}