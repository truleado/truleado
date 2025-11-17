export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { paddleAPI, updateUserSubscription } from '@/lib/paddle-config'
import { trialManager } from '@/lib/trial-manager'
import { sendUpgradeThankYouEmail } from '@/lib/upgrade-email-service'

export async function GET() {
  return NextResponse.json({ 
    message: 'Paddle webhook endpoint is active',
    methods: ['POST'],
    status: 'ready'
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('Paddle webhook received')
    
    const body = await request.text()
    const signature = request.headers.get('paddle-signature') || ''
    
    console.log('Webhook signature:', signature)
    console.log('Webhook body length:', body.length)
    
    // Verify webhook signature (skip in development/testing)
    if (process.env.NODE_ENV === 'production' && !paddleAPI.verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log('Webhook event:', event.event_type, event.event_id)
    console.log('Event data:', JSON.stringify(event.data, null, 2))

    const supabase = await createClient()

    switch (event.event_type) {
      case 'checkout.session.completed': {
        const session = event.data
        console.log('Checkout session completed:', session.id)
        
        // Get user email from session
        const userEmail = session.customer_email
        const customData = session.custom_data || {}
        const userId = customData.user_id

        console.log('Checkout session details:', {
          sessionId: session.id,
          customerEmail: userEmail,
          customData,
          userId
        })

        // Send upgrade thank you email immediately (don't wait for database lookup)
        try {
          if (userEmail) {
            console.log('Sending upgrade thank you email to:', userEmail)
            const emailResult = await sendUpgradeThankYouEmail(userEmail, 'Valued Customer', 'Pro')
            if (emailResult.success) {
              console.log('✅ Upgrade thank you email sent successfully to:', userEmail)
            } else {
              console.error('❌ Failed to send upgrade email:', emailResult.error)
            }
          } else {
            console.warn('No customer email found in checkout session')
          }
        } catch (emailError) {
          console.error('Failed to send upgrade email:', emailError)
          // Don't fail the webhook if email fails
        }

        // Try to update user subscription - try multiple methods to find user
        let profileToUpdate = null
        
        // Method 1: Use userId from custom_data if available
        if (userId) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (profile && !profileError) {
            profileToUpdate = profile
          }
        }
        
        // Method 2: If not found, try to find by email
        if (!profileToUpdate && userEmail) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userEmail.toLowerCase())
            .single()
          
          if (profile && !profileError) {
            profileToUpdate = profile
            console.log('Found user by email:', userEmail)
          }
        }
        
        // Method 3: If still not found, try by paddle_customer_id
        if (!profileToUpdate && session.customer_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('paddle_customer_id', session.customer_id)
            .single()
          
          if (profile && !profileError) {
            profileToUpdate = profile
            console.log('Found user by paddle_customer_id:', session.customer_id)
          }
        }
        
        // Update subscription if we found a user
        if (profileToUpdate) {
          try {
            const nextBillingDate = session.next_billed_at || session.details?.next_billed_at || session.items?.[0]?.price?.billing_cycle?.interval_unit === 'month' 
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            
            await updateUserSubscription(profileToUpdate.id, {
              subscription_status: 'active',
              paddle_customer_id: session.customer_id || profileToUpdate.paddle_customer_id,
              paddle_subscription_id: session.subscription_id || profileToUpdate.paddle_subscription_id,
              subscription_ends_at: nextBillingDate
            })

            // Log subscription change
            await trialManager.logSubscriptionChange(
              profileToUpdate.id,
              'active',
              profileToUpdate.subscription_status || 'trial',
              'subscription_activated',
              `webhook_${event.event_id}`,
              { 
                session_id: session.id,
                customer_id: session.customer_id,
                amount: session.details?.totals?.total || session.amount
              }
            )

            console.log('✅ Subscription activated for user:', profileToUpdate.id, profileToUpdate.email)
          } catch (dbError) {
            console.error('❌ Failed to update user subscription:', dbError)
            // Don't fail the webhook if database update fails
          }
        } else {
          console.warn('⚠️ No user found for checkout session:', {
            userId,
            userEmail,
            customerId: session.customer_id
          })
        }

        break
      }

      case 'subscription.created': {
        const subscription = event.data
        console.log('Subscription created:', subscription.id)
        
        // Send upgrade thank you email immediately if we have customer email
        try {
          if (subscription.customer_email) {
            console.log('Sending upgrade email for subscription.created to:', subscription.customer_email)
            const emailResult = await sendUpgradeThankYouEmail(subscription.customer_email, 'Valued Customer', 'Pro')
            if (emailResult.success) {
              console.log('✅ Upgrade thank you email sent successfully for subscription:', subscription.customer_email)
            } else {
              console.error('❌ Failed to send upgrade email for subscription:', emailResult.error)
            }
          }
        } catch (emailError) {
          console.error('Failed to send upgrade email for subscription:', emailError)
        }

        // Try to find and update user by customer ID
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('paddle_customer_id', subscription.customer_id)
            .single()

          if (profile && !profileError) {
            // Update user with subscription ID
            await updateUserSubscription(profile.id, {
              subscription_status: 'active',
              paddle_subscription_id: subscription.id,
              subscription_ends_at: subscription.next_billed_at 
                ? new Date(subscription.next_billed_at).toISOString()
                : undefined
            })
            console.log('Subscription created for user:', profile.id)
          } else {
            console.log('No user found for customer ID:', subscription.customer_id)
          }
        } catch (dbError) {
          console.error('Failed to update user subscription:', dbError)
        }

        break
      }

      case 'subscription.updated': {
        const subscription = event.data
        console.log('Subscription updated:', subscription.id)
        
        // Find user by subscription ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('paddle_subscription_id', subscription.id)
          .single()

        if (profileError || !profile) {
          console.error('Error finding user profile:', profileError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update subscription status based on subscription status
        const subscriptionStatus = subscription.status === 'active' ? 'active' : 'cancelled'
        
        await updateUserSubscription(profile.id, {
          subscription_status: subscriptionStatus,
          subscription_ends_at: subscription.next_billed_at 
            ? new Date(subscription.next_billed_at).toISOString()
            : undefined
        })

        // Log subscription change
        await trialManager.logSubscriptionChange(
          profile.id,
          subscriptionStatus,
          'active',
          'subscription_updated',
          `webhook_${event.event_id}`,
          { 
            subscription_id: subscription.id,
            status: subscription.status
          }
        )

        console.log('Subscription updated for user:', profile.id, 'Status:', subscriptionStatus)
        break
      }

      case 'subscription.canceled': {
        const subscription = event.data
        console.log('Subscription cancelled:', subscription.id)
        
        // Find user by subscription ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('paddle_subscription_id', subscription.id)
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
          `webhook_${event.event_id}`,
          { 
            subscription_id: subscription.id
          }
        )

        console.log('Subscription cancelled for user:', profile.id)
        break
      }

      case 'transaction.completed': {
        const transaction = event.data
        console.log('Payment succeeded:', transaction.id)
        
        // Send upgrade thank you email immediately if we have customer email
        try {
          if (transaction.customer_email) {
            console.log('Sending upgrade email for transaction.completed to:', transaction.customer_email)
            const emailResult = await sendUpgradeThankYouEmail(transaction.customer_email, 'Valued Customer', 'Pro')
            if (emailResult.success) {
              console.log('✅ Upgrade thank you email sent successfully for transaction:', transaction.customer_email)
            } else {
              console.error('❌ Failed to send upgrade email for transaction:', emailResult.error)
            }
          }
        } catch (emailError) {
          console.error('Failed to send upgrade email for transaction:', emailError)
        }

        // Try to find and update user - try multiple methods
        let profileToUpdate = null
        
        // Method 1: Find by customer ID
        if (transaction.customer_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('paddle_customer_id', transaction.customer_id)
            .single()

          if (profile && !profileError) {
            profileToUpdate = profile
          }
        }
        
        // Method 2: If not found, try by email
        if (!profileToUpdate && transaction.customer_email) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', transaction.customer_email.toLowerCase())
            .single()

          if (profile && !profileError) {
            profileToUpdate = profile
            console.log('Found user by email for transaction:', transaction.customer_email)
          }
        }
        
        // Update subscription if we found a user
        if (profileToUpdate) {
          try {
            // Ensure subscription is active - use Paddle's actual billing cycle
            const nextBillingDate = transaction.next_billed_at || transaction.details?.next_billed_at || 
              (transaction.subscription_id ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null)
            
            await updateUserSubscription(profileToUpdate.id, {
              subscription_status: 'active',
              paddle_customer_id: transaction.customer_id || profileToUpdate.paddle_customer_id,
              paddle_subscription_id: transaction.subscription_id || profileToUpdate.paddle_subscription_id,
              subscription_ends_at: nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            
            console.log('✅ Payment processed for user:', profileToUpdate.id, profileToUpdate.email)
          } catch (dbError) {
            console.error('❌ Failed to update user subscription:', dbError)
          }
        } else {
          console.warn('⚠️ No user found for transaction:', {
            customerId: transaction.customer_id,
            customerEmail: transaction.customer_email
          })
        }

        break
      }

      case 'transaction.payment_failed': {
        const transaction = event.data
        console.log('Payment failed:', transaction.id)
        
        // Find user by customer ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('paddle_customer_id', transaction.customer_id)
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
          `webhook_${event.event_id}`,
          { 
            transaction_id: transaction.id,
            amount: transaction.details?.totals?.total
          }
        )

        console.log('Payment failed for user:', profile.id)
        break
      }

      case 'subscription.payment_succeeded': {
        const subscription = event.data
        console.log('Recurring payment succeeded:', subscription.id)
        
        // Find user by subscription ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('paddle_subscription_id', subscription.id)
          .single()

        if (profileError || !profile) {
          console.error('Error finding user profile:', profileError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update subscription with new billing date
        await updateUserSubscription(profile.id, {
          subscription_status: 'active',
          subscription_ends_at: subscription.next_billed_at 
            ? new Date(subscription.next_billed_at).toISOString()
            : undefined
        })

        // Log successful recurring payment
        await trialManager.logSubscriptionChange(
          profile.id,
          'active',
          'active',
          'recurring_payment_succeeded',
          `webhook_${event.event_id}`,
          { 
            subscription_id: subscription.id,
            next_billed_at: subscription.next_billed_at
          }
        )

        console.log('Recurring payment processed for user:', profile.id)
        break
      }

      case 'subscription.payment_failed': {
        const subscription = event.data
        console.log('Recurring payment failed:', subscription.id)
        
        // Find user by subscription ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('paddle_subscription_id', subscription.id)
          .single()

        if (profileError || !profile) {
          console.error('Error finding user profile:', profileError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update subscription status to past_due (Paddle will retry)
        await updateUserSubscription(profile.id, {
          subscription_status: 'past_due'
        })

        // Log failed recurring payment
        await trialManager.logSubscriptionChange(
          profile.id,
          'past_due',
          'active',
          'recurring_payment_failed',
          `webhook_${event.event_id}`,
          { 
            subscription_id: subscription.id,
            next_retry_at: subscription.next_billed_at
          }
        )

        console.log('Recurring payment failed for user:', profile.id)
        break
      }

      default:
        console.log('Unhandled webhook event type:', event.event_type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    }, { status: 500 })
  }
}
