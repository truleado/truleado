export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { paddleAPI, paddleConfig, updateUserSubscription } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, paddle_customer_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({
        error: 'User profile not found'
      }, { status: 404 })
    }

    if (profile.subscription_status !== 'cancelled') {
      return NextResponse.json({
        error: 'Subscription is not cancelled. Cannot restart active subscription.'
      }, { status: 400 })
    }

    if (!paddleConfig.priceId) {
      return NextResponse.json({
        error: 'Billing configuration missing. Please contact support.'
      }, { status: 500 })
    }

    // Redirect to checkout to collect payment details and restart subscription
    // Subscriptions must be created through checkout flow
    console.log('Redirecting user to checkout to restart subscription')

    return NextResponse.json({
      success: true,
      message: 'Redirecting to checkout to restart your subscription',
      requiresCheckout: true,
      checkoutUrl: '/checkout'
    })

  } catch (error) {
    console.error('Restart subscription error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

