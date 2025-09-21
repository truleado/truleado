import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { razorpayAPI, razorpayConfig } from '@/lib/razorpay-config'

export async function POST(request: NextRequest) {
  try {
    console.log('Checkout API called')
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Create or get Razorpay customer
    let customer
    try {
      console.log('Attempting to get customer:', user.id)
      customer = await razorpayAPI.getCustomer(user.id)
      console.log('Customer found:', customer.id)
    } catch (error) {
      console.log('Customer not found, creating new one:', error)
      // Customer doesn't exist, create one
      customer = await razorpayAPI.createCustomer(user.email!, user.user_metadata?.full_name)
      console.log('Customer created:', customer.id)
    }

    // Create subscription with user metadata
    console.log('Creating subscription for customer:', customer.id, 'with plan:', razorpayConfig.planId)
    const subscription: any = await razorpayAPI.createSubscription(customer.id, razorpayConfig.planId)
    console.log('Subscription created:', subscription.id)
    
    // Update subscription with user metadata for webhook processing
    try {
      await razorpayAPI.updateSubscriptionNotes(subscription.id, {
        user_id: user.id,
        user_email: user.email
      })
      console.log('Subscription notes updated')
    } catch (error) {
      console.warn('Failed to update subscription notes:', error)
    }
    
    return NextResponse.json({
      subscription_id: subscription.id,
      customer_id: customer.id,
      checkout_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/razorpay-checkout?subscription_id=${subscription.id}`
    })
  } catch (error) {
    console.error('Checkout error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
