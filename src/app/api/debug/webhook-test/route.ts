import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testType, customerId, subscriptionId } = body

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let result = {}

    switch (testType) {
      case 'checkout_completed':
        // Simulate checkout.session.completed webhook
        result = await serviceSupabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            paddle_customer_id: customerId || 'test_customer_123',
            subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', user.id)
          .select()
        break

      case 'subscription_created':
        // Simulate subscription.created webhook
        result = await serviceSupabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            paddle_subscription_id: subscriptionId || 'test_subscription_123',
            subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', user.id)
          .select()
        break

      case 'transaction_completed':
        // Simulate transaction.completed webhook
        result = await serviceSupabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', user.id)
          .select()
        break

      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      testType,
      userId: user.id,
      result
    })

  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_ends_at, paddle_customer_id, paddle_subscription_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      subscription_status: profile.subscription_status,
      subscription_ends_at: profile.subscription_ends_at,
      paddle_customer_id: profile.paddle_customer_id,
      paddle_subscription_id: profile.paddle_subscription_id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook test GET error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}
