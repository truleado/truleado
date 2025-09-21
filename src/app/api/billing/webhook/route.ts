import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { dodoPaymentsAPI, updateUserSubscription } from '@/lib/dodo-payments-config'
import { trialManager } from '@/lib/trial-manager'

export async function POST(request: NextRequest) {
  try {
    console.log('Dodo Payments webhook received')
    
    const body = await request.text()
    const signature = request.headers.get('dodo-signature') || ''
    
    // Verify webhook signature
    if (!dodoPaymentsAPI.verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log('Webhook event:', event.type, event.id)

    const supabase = createClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout session completed:', session.id)
        
        // Find user by customer ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('dodo_customer_id', session.customer)
          .single()

        if (profileError || !profile) {
          console.error('Error finding user profile:', profileError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update subscription status
        await updateUserSubscription(profile.id, {
          subscription_status: 'active',
          subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })

        // Log subscription change
        await trialManager.logSubscriptionChange(
          profile.id,
          'active',
          'trial',
          'subscription_activated',
          `webhook_${event.id}`,
          { 
            session_id: session.id,
            customer_id: session.customer,
            amount: session.amount_total
          }
        )

        console.log('Subscription activated for user:', profile.id)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object
        console.log('Subscription created:', subscription.id)
        
        // Find user by customer ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('dodo_customer_id', subscription.customer)
          .single()

        if (profileError || !profile) {
          console.error('Error finding user profile:', profileError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update user with subscription ID
        await updateUserSubscription(profile.id, {
          subscription_status: 'active',
          dodo_subscription_id: subscription.id,
          subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
        })

        console.log('Subscription created for user:', profile.id)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Subscription updated:', subscription.id)
        
        // Find user by subscription ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('dodo_subscription_id', subscription.id)
          .single()

        if (profileError || !profile) {
          console.error('Error finding user profile:', profileError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update subscription status based on subscription status
        const subscriptionStatus = subscription.status === 'active' ? 'active' : 'cancelled'
        
        await updateUserSubscription(profile.id, {
          subscription_status: subscriptionStatus,
          subscription_ends_at: subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : undefined
        })

        // Log subscription change
        await trialManager.logSubscriptionChange(
          profile.id,
          subscriptionStatus,
          'active',
          'subscription_updated',
          `webhook_${event.id}`,
          { 
            subscription_id: subscription.id,
            status: subscription.status
          }
        )

        console.log('Subscription updated for user:', profile.id, 'Status:', subscriptionStatus)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription cancelled:', subscription.id)
        
        // Find user by subscription ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('dodo_subscription_id', subscription.id)
          .single()

        if (profileError || !profile) {
          console.error('Error finding user profile:', profileError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update subscription status to cancelled
        await updateUserSubscription(profile.id, {
          subscription_status: 'cancelled'
        })

        // Log subscription change
        await trialManager.logSubscriptionChange(
          profile.id,
          'cancelled',
          'active',
          'subscription_cancelled',
          `webhook_${event.id}`,
          { 
            subscription_id: subscription.id
          }
        )

        console.log('Subscription cancelled for user:', profile.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('Payment succeeded:', invoice.id)
        
        // Find user by customer ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('dodo_customer_id', invoice.customer)
          .single()

        if (profileError || !profile) {
          console.error('Error finding user profile:', profileError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Ensure subscription is active
        await updateUserSubscription(profile.id, {
          subscription_status: 'active',
          subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })

        console.log('Payment processed for user:', profile.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('Payment failed:', invoice.id)
        
        // Find user by customer ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('dodo_customer_id', invoice.customer)
          .single()

        if (profileError || !profile) {
          console.error('Error finding user profile:', profileError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Log payment failure
        await trialManager.logSubscriptionChange(
          profile.id,
          'payment_failed',
          'active',
          'payment_failed',
          `webhook_${event.id}`,
          { 
            invoice_id: invoice.id,
            amount: invoice.amount_due
          }
        )

        console.log('Payment failed for user:', profile.id)
        break
      }

      default:
        console.log('Unhandled webhook event type:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    }, { status: 500 })
  }
}
