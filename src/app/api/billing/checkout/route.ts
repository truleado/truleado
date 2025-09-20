import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { razorpayAPI, razorpayConfig } from '@/lib/razorpay-config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create or get Razorpay customer
    let customer
    try {
      customer = await razorpayAPI.getCustomer(user.id)
    } catch (error) {
      // Customer doesn't exist, create one
      customer = await razorpayAPI.createCustomer(user.email!, user.user_metadata?.full_name)
    }

    // Create subscription with user metadata
    const subscription: any = await razorpayAPI.createSubscription(customer.id, razorpayConfig.planId)
    
    // Update subscription with user metadata for webhook processing
    try {
      await razorpayAPI.updateSubscriptionNotes(subscription.id, {
        user_id: user.id,
        user_email: user.email
      })
    } catch (error) {
      console.warn('Failed to update subscription notes:', error)
    }
    
    return NextResponse.json({
      subscription_id: subscription.id,
      customer_id: customer.id,
      checkout_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/razorpay-checkout?subscription_id=${subscription.id}`
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create checkout session'
    }, { status: 500 })
  }
}
