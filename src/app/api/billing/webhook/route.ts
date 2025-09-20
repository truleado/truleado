import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { paddleConfig, verifyPaddleWebhook, paddleAPI } from '@/lib/paddle-config'
import { trialManager } from '@/lib/trial-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('paddle-signature')
    
    // Verify webhook signature
    if (!signature) {
      console.error('Missing Paddle signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const isValid = verifyPaddleWebhook(body, signature, paddleConfig.webhookSecret)
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('Paddle webhook received:', event.event_type)

    const supabase = createClient()

    switch (event.event_type) {
      case 'transaction.completed':
        await handleTransactionCompleted(event, supabase)
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
      
      case 'subscription.past_due':
        await handleSubscriptionPastDue(event, supabase)
        break
      
      default:
        console.log('Unhandled webhook event:', event.event_type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    }, { status: 500 })
  }
}

async function handleTransactionCompleted(event: any, supabase: any) {
  const transaction = event.data
  const customerId = transaction.custom_data?.user_id
  
  if (!customerId) {
    console.error('No user ID in transaction data')
    return
  }

  try {
    // Get full transaction details from Paddle API
    const fullTransaction = await paddleAPI.getTransaction(transaction.id)
    
    // Update user subscription status
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        paddle_customer_id: transaction.customer_id,
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
        'transaction_completed',
        event.event_id,
        { 
          transaction_id: transaction.id,
          amount: fullTransaction.details?.totals?.total,
          currency: fullTransaction.details?.currency_code
        }
      )
    }
  } catch (apiError) {
    console.error('Error fetching transaction details from Paddle API:', apiError)
    // Fallback to basic update without API call
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        paddle_customer_id: transaction.customer_id,
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', customerId)

    if (error) {
      console.error('Error updating user subscription (fallback):', error)
    }
  }
}

async function handleSubscriptionCreated(event: any, supabase: any) {
  const subscription = event.data
  const customerId = subscription.custom_data?.user_id
  
  if (!customerId) {
    console.error('No user ID in subscription data')
    return
  }

  try {
    // Get full subscription details from Paddle API
    const fullSubscription = await paddleAPI.getSubscription(subscription.id)
    
    // Update user with subscription ID
    const { error } = await supabase
      .from('profiles')
      .update({
        paddle_subscription_id: subscription.id,
        subscription_ends_at: new Date(subscription.next_billed_at).toISOString(),
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
        event.event_id,
        { 
          subscription_id: subscription.id,
          price_id: fullSubscription.items?.[0]?.price_id,
          billing_cycle: fullSubscription.billing_cycle
        }
      )
    }
  } catch (apiError) {
    console.error('Error fetching subscription details from Paddle API:', apiError)
    // Fallback to basic update
    const { error } = await supabase
      .from('profiles')
      .update({
        paddle_subscription_id: subscription.id,
        subscription_ends_at: new Date(subscription.next_billed_at).toISOString(),
        subscription_status: 'active'
      })
      .eq('id', customerId)

    if (error) {
      console.error('Error updating user subscription ID (fallback):', error)
    }
  }
}

async function handleSubscriptionUpdated(event: any, supabase: any) {
  const subscription = event.data
  const customerId = subscription.custom_data?.user_id
  
  if (!customerId) {
    console.error('No user ID in subscription data')
    return
  }

  // Update subscription end date
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_ends_at: new Date(subscription.next_billed_at).toISOString()
    })
    .eq('id', customerId)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionCancelled(event: any, supabase: any) {
  const subscription = event.data
  const customerId = subscription.custom_data?.user_id
  
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
      event.event_id,
      { subscription_id: subscription.id }
    )
  }
}

async function handleSubscriptionPastDue(event: any, supabase: any) {
  const subscription = event.data
  const customerId = subscription.custom_data?.user_id
  
  if (!customerId) {
    console.error('No user ID in subscription data')
    return
  }

  // Update user subscription status
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due'
    })
    .eq('id', customerId)

  if (error) {
    console.error('Error updating subscription to past due:', error)
  } else {
    await trialManager.logSubscriptionChange(
      customerId,
      'past_due',
      'active',
      'subscription_past_due',
      event.event_id,
      { subscription_id: subscription.id }
    )
  }
}
