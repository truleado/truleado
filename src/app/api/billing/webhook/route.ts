export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, updateUserSubscription } from '@/lib/paddle-config'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('paddle-signature') || ''

    // Verify webhook signature
    if (process.env.NODE_ENV === 'production' && !paddleAPI.verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log('📥 Paddle webhook received:', event.event_type)

    const supabase = await createClient()

    // Handle different event types
    switch (event.event_type) {
      case 'checkout.completed': {
        const checkout = event.data
        console.log('✅ Checkout completed:', checkout.id)

        // Find user by email or customer ID
        const customerEmail = checkout.customer?.email || checkout.customer_email
        const subscriptionId = checkout.subscription_id

        if (customerEmail && subscriptionId) {
          // Find user by email
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', customerEmail)
            .single()

          if (profile) {
            // Get subscription details from Paddle
            const subscription = await paddleAPI.getSubscription(subscriptionId)
            
            // Determine status - if trialing, set to trial, otherwise active
            const status = subscription.status === 'trialing' || subscription.status === 'active' 
              ? (subscription.status === 'trialing' ? 'trial' : 'active')
              : 'trial' // Default to trial if status is unclear
            
            // Calculate trial end date (7 days from now if not provided)
            let trialEndsAt = subscription.trialEndsAt
            if (!trialEndsAt && status === 'trial') {
              const trialEnd = new Date()
              trialEnd.setDate(trialEnd.getDate() + 7)
              trialEndsAt = trialEnd.toISOString()
            }
            
            await updateUserSubscription(profile.id, {
              subscription_status: status,
              paddle_subscription_id: subscriptionId,
              paddle_customer_id: checkout.customer_id || subscription.customerId,
              trial_ends_at: trialEndsAt || null,
              subscription_ends_at: subscription.nextBilledAt || null
            })
            console.log(`✅ User subscription created with ${status} status (7-day trial, then $49/month):`, profile.id)
          }
        }
        break
      }

      case 'subscription.created': {
        const subscription = event.data
        console.log('✅ Subscription created:', subscription.id)

        // Find user by subscription ID or customer email
        let profile = null
        
        // Try to find by subscription ID first
        const { data: profileBySub } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('paddle_subscription_id', subscription.id)
          .single()
        
        profile = profileBySub

        // If not found, try to find by customer email
        if (!profile && subscription.customer_id) {
          // Get customer from Paddle to get email
          try {
            const customer = await paddleAPI.getCustomer(subscription.customer_id)
            if (customer?.email) {
              const { data: profileByEmail } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('email', customer.email)
                .single()
              profile = profileByEmail
            }
          } catch (err) {
            console.error('Error fetching customer:', err)
          }
        }

        if (profile) {
          // Determine if subscription is in trial
          const isTrialing = subscription.status === 'trialing' || subscription.status === 'active'
          const status = isTrialing ? 'trial' : 'active'
          
          // Calculate trial end (7 days from creation if not provided)
          let trialEndsAt = subscription.trial_end || null
          if (!trialEndsAt && status === 'trial') {
            const trialEnd = new Date()
            trialEnd.setDate(trialEnd.getDate() + 7)
            trialEndsAt = trialEnd.toISOString()
          }
          
          await updateUserSubscription(profile.id, {
            subscription_status: status,
            paddle_subscription_id: subscription.id,
            paddle_customer_id: subscription.customer_id || null,
            subscription_ends_at: subscription.next_billed_at || null,
            trial_ends_at: trialEndsAt
          })
          console.log(`✅ Updated user subscription status to ${status} (7-day trial, then $49/month)`)
        }
        break
      }

      case 'subscription.updated': {
        const subscription = event.data
        console.log('🔄 Subscription updated:', subscription.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paddle_subscription_id', subscription.id)
          .single()

        if (profile) {
          const status = subscription.status === 'active' ? 'active' : 
                       subscription.status === 'trialing' ? 'trial' :
                       subscription.status === 'past_due' ? 'past_due' :
                       subscription.status === 'canceled' ? 'cancelled' : 'expired'

          await updateUserSubscription(profile.id, {
            subscription_status: status as any,
            subscription_ends_at: subscription.next_billed_at || null,
            trial_ends_at: subscription.trial_end || null
          })
          console.log('✅ Updated subscription status:', status)
        }
        break
      }

      case 'subscription.payment_succeeded': {
        const transaction = event.data
        const subscriptionId = transaction.subscription_id

        console.log('💳 Payment succeeded for subscription:', subscriptionId)

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paddle_subscription_id', subscriptionId)
          .single()

        if (profile) {
          // Get subscription details to get next billing date
          const subscription = await paddleAPI.getSubscription(subscriptionId)
          
          await updateUserSubscription(profile.id, {
            subscription_status: 'active',
            subscription_ends_at: subscription.nextBilledAt || null
          })
          console.log('✅ User subscription activated:', profile.id)
        }
        break
      }

      case 'subscription.payment_failed': {
        const transaction = event.data
        const subscriptionId = transaction.subscription_id

        console.log('❌ Payment failed for subscription:', subscriptionId)

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paddle_subscription_id', subscriptionId)
          .single()

        if (profile) {
          await updateUserSubscription(profile.id, {
            subscription_status: 'past_due'
          })
          console.log('⚠️ User subscription set to past_due:', profile.id)
        }
        break
      }

      case 'subscription.canceled': {
        const subscription = event.data
        console.log('🚫 Subscription cancelled:', subscription.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paddle_subscription_id', subscription.id)
          .single()

        if (profile) {
          await updateUserSubscription(profile.id, {
            subscription_status: 'cancelled'
          })
          console.log('✅ User subscription cancelled:', profile.id)
        }
        break
      }

      case 'subscription.trial_ended': {
        const subscription = event.data
        console.log('⏰ Trial ended for subscription:', subscription.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paddle_subscription_id', subscription.id)
          .single()

        if (profile) {
          // If payment hasn't succeeded yet, mark as expired
          if (subscription.status !== 'active') {
            await updateUserSubscription(profile.id, {
              subscription_status: 'expired'
            })
            console.log('⚠️ Trial ended, subscription expired:', profile.id)
          }
        }
        break
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.event_type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    }, { status: 500 })
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Paddle webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}

