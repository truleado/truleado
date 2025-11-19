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

    if (!paddleConfig.priceId) {
      return NextResponse.json({
        error: 'Billing configuration missing. Please contact support.'
      }, { status: 500 })
    }

    // Check if user already has a subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('paddle_subscription_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (profile?.paddle_subscription_id) {
      return NextResponse.json({
        error: 'User already has an active subscription',
        subscription_id: profile.paddle_subscription_id
      }, { status: 400 })
    }

    // Create Paddle subscription with 7-day trial
    const subscription = await paddleAPI.createSubscription({
      customerId: user.id,
      customerEmail: user.email!,
      customerName: user.user_metadata?.full_name,
      priceId: paddleConfig.priceId,
      trialDays: 7 // 7-day free trial
    })

    // Calculate trial end date (7 days from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    // Update user profile with subscription info
    await updateUserSubscription(user.id, {
      subscription_status: 'trial',
      paddle_subscription_id: subscription.subscriptionId,
      paddle_customer_id: subscription.customerId,
      trial_ends_at: subscription.trialEndsAt || trialEndsAt.toISOString(),
      subscription_ends_at: subscription.nextBilledAt || null
    })

    console.log('✅ Subscription created for user:', user.id, 'Subscription ID:', subscription.subscriptionId)

    return NextResponse.json({
      success: true,
      subscription_id: subscription.subscriptionId,
      customer_id: subscription.customerId,
      status: subscription.status,
      trial_ends_at: subscription.trialEndsAt || trialEndsAt.toISOString()
    })

  } catch (error) {
    console.error('Create subscription error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create subscription'
    return NextResponse.json({
      error: message
    }, { status: 500 })
  }
}

