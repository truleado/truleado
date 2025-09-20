import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { razorpayConfig, verifyRazorpayWebhook, razorpayAPI } from '@/lib/razorpay-config'
import { trialManager } from '@/lib/trial-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    
    // Verify webhook signature
    if (!signature) {
      console.error('Missing Razorpay signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const isValid = verifyRazorpayWebhook(body, signature, razorpayConfig.webhookSecret)
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('Razorpay webhook received:', event.event)

    const supabase = createClient()

    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event, supabase)
        break
      
      case 'subscription.created':
        await handleSubscriptionCreated(event, supabase)
        break
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(event, supabase)
        break
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event, supabase)
        break
      
      case 'subscription.paused':
        await handleSubscriptionPaused(event, supabase)
        break
      
      case 'subscription.resumed':
        await handleSubscriptionResumed(event, supabase)
        break
      
      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    }, { status: 500 })
  }
}

async function handlePaymentCaptured(event: any, supabase: any) {
  const payment = event.payload.payment.entity
  const customerId = payment.notes?.user_id
  
  if (!customerId) {
    console.error('No user ID in payment data')
    return
  }

  try {
    // Get full payment details from Razorpay API
    const fullPayment = await razorpayAPI.getPayment(payment.id)
    
    // Update user subscription status
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        razorpay_customer_id: payment.customer_id,
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
      .eq('id', customerId)

    if (error) {
      console.error('Error updating user subscription:', error)
    } else {
      await trialManager.logSubscriptionChange(
        customerId,
        'active',
        'trial',
        'payment_captured',
        event.id,
        { 
          payment_id: payment.id,
          amount: fullPayment.amount,
          currency: fullPayment.currency
        }
      )
    }
  } catch (apiError) {
    console.error('Error fetching payment details from Razorpay API:', apiError)
    // Fallback to basic update without API call
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        razorpay_customer_id: payment.customer_id,
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', customerId)

    if (error) {
      console.error('Error updating user subscription (fallback):', error)
    }
  }
}

async function handleSubscriptionCreated(event: any, supabase: any) {
  const subscription = event.payload.subscription.entity
  const customerId = subscription.notes?.user_id
  
  if (!customerId) {
    console.error('No user ID in subscription data')
    return
  }

  try {
    // Get full subscription details from Razorpay API
    const fullSubscription = await razorpayAPI.getSubscription(subscription.id)
    
    // Update user with subscription ID
    const { error } = await supabase
      .from('profiles')
      .update({
        razorpay_subscription_id: subscription.id,
        subscription_ends_at: new Date(subscription.current_end).toISOString(),
        subscription_status: 'active'
      })
      .eq('id', customerId)

    if (error) {
      console.error('Error updating user subscription ID:', error)
    } else {
      await trialManager.logSubscriptionChange(
        customerId,
        'active',
        'trial',
        'subscription_created',
        event.id,
        { 
          subscription_id: subscription.id,
          plan_id: fullSubscription.plan_id,
          billing_cycle: fullSubscription.billing_cycle
        }
      )
    }
  } catch (apiError) {
    console.error('Error fetching subscription details from Razorpay API:', apiError)
    // Fallback to basic update
    const { error } = await supabase
      .from('profiles')
      .update({
        razorpay_subscription_id: subscription.id,
        subscription_ends_at: new Date(subscription.current_end).toISOString(),
        subscription_status: 'active'
      })
      .eq('id', customerId)

    if (error) {
      console.error('Error updating user subscription ID (fallback):', error)
    }
  }
}

async function handleSubscriptionUpdated(event: any, supabase: any) {
  const subscription = event.payload.subscription.entity
  const customerId = subscription.notes?.user_id
  
  if (!customerId) {
    console.error('No user ID in subscription data')
    return
  }

  // Update subscription end date
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_ends_at: new Date(subscription.current_end).toISOString()
    })
    .eq('id', customerId)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionCancelled(event: any, supabase: any) {
  const subscription = event.payload.subscription.entity
  const customerId = subscription.notes?.user_id
  
  if (!customerId) {
    console.error('No user ID in subscription data')
    return
  }

  // Update user subscription status
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'cancelled'
    })
    .eq('id', customerId)

  if (error) {
    console.error('Error cancelling subscription:', error)
  } else {
    await trialManager.logSubscriptionChange(
      customerId,
      'cancelled',
      'active',
      'subscription_cancelled',
      event.id,
      { subscription_id: subscription.id }
    )
  }
}

async function handleSubscriptionPaused(event: any, supabase: any) {
  const subscription = event.payload.subscription.entity
  const customerId = subscription.notes?.user_id
  
  if (!customerId) {
    console.error('No user ID in subscription data')
    return
  }

  // Update user subscription status
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'paused'
    })
    .eq('id', customerId)

  if (error) {
    console.error('Error updating subscription to paused:', error)
  } else {
    await trialManager.logSubscriptionChange(
      customerId,
      'paused',
      'active',
      'subscription_paused',
      event.id,
      { subscription_id: subscription.id }
    )
  }
}

async function handleSubscriptionResumed(event: any, supabase: any) {
  const subscription = event.payload.subscription.entity
  const customerId = subscription.notes?.user_id
  
  if (!customerId) {
    console.error('No user ID in subscription data')
    return
  }

  // Update user subscription status
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active'
    })
    .eq('id', customerId)

  if (error) {
    console.error('Error updating subscription to active:', error)
  } else {
    await trialManager.logSubscriptionChange(
      customerId,
      'active',
      'paused',
      'subscription_resumed',
      event.id,
      { subscription_id: subscription.id }
    )
  }
}
