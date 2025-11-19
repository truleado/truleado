import { createClient } from '@/lib/supabase-server'
import { Paddle } from '@paddle/paddle-node-sdk'

// Paddle Configuration
const resolvedEnvironment = (process.env.NEXT_PUBLIC_PADDLE_ENV || process.env.PADDLE_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox')) as 'sandbox' | 'production'

const resolvedBaseUrl = resolvedEnvironment === 'production'
  ? 'https://api.paddle.com'
  : 'https://api.sandbox.paddle.com'

// Helper function to clean environment variable values
function cleanEnvVar(value: string): string {
  if (!value) return ''
  return value.trim().replace(/^["']|["']$/g, '').trim()
}

export const paddleConfig = {
  apiKey: cleanEnvVar(process.env.PADDLE_API_KEY || ''),
  clientToken: cleanEnvVar(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || ''),
  webhookSecret: cleanEnvVar(process.env.PADDLE_WEBHOOK_SECRET || ''),
  priceId: cleanEnvVar(process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || process.env.PADDLE_PRICE_ID || ''),
  environment: resolvedEnvironment,
  baseUrl: resolvedBaseUrl
}

// Initialize Paddle SDK
let paddle: Paddle | null = null

try {
  if (paddleConfig.apiKey) {
    paddle = new Paddle(paddleConfig.apiKey, {
      environment: paddleConfig.environment === 'production' ? 'production' : 'sandbox'
    })
    console.log('✅ Paddle SDK initialized successfully')
  } else {
    console.warn('⚠️ Paddle API key not found, SDK not initialized')
  }
} catch (error) {
  console.error('❌ Failed to initialize Paddle SDK:', error)
  paddle = null
}

// Paddle API Client
export class PaddleAPI {
  private apiKey: string
  private baseUrl: string
  private paddle: Paddle | null

  constructor() {
    this.apiKey = paddleConfig.apiKey
    this.baseUrl = paddleConfig.baseUrl
    this.paddle = paddle || null
  }

  private ensureSDKInitialized() {
    if (!this.paddle) {
      throw new Error('Paddle SDK not initialized. Please check your PADDLE_API_KEY environment variable.')
    }
    return this.paddle
  }

  // Create a subscription with trial period
  async createSubscription(data: {
    customerId: string
    customerEmail: string
    customerName?: string
    priceId: string
    trialDays?: number
    existingCustomerId?: string // Optional: use existing Paddle customer ID to avoid conflicts
  }) {
    if (!this.apiKey) {
      throw new Error('PADDLE_API_KEY is required')
    }

    const paddle = this.ensureSDKInitialized()

    try {
      // First, create or get customer
      let customerId: string | undefined
      
      // Use existing customer ID if provided (from database)
      if (data.existingCustomerId) {
        customerId = data.existingCustomerId
        console.log('Using existing customer ID from database:', customerId)
      } else {
        try {
          // Try to find existing customer by email
          const customers = await paddle.customers.list({
            email: data.customerEmail,
          })
          
          if (customers && customers.data && customers.data.length > 0) {
            customerId = customers.data[0].id
            console.log('Found existing customer by email:', customerId)
          } else {
            // Try to create new customer
            try {
              const customer = await paddle.customers.create({
                email: data.customerEmail,
                name: data.customerName,
                customData: {
                  user_id: data.customerId,
                  user_email: data.customerEmail
                }
              })
              customerId = customer.id
              console.log('Created new customer:', customerId)
            } catch (createError: any) {
              // If customer creation fails due to email conflict, extract customer ID from error
              if (createError.message && createError.message.includes('conflicts with customer')) {
                console.log('Customer email conflict detected, extracting customer ID from error...')
                // Extract customer ID from error message: "customer email conflicts with customer of id ctm_xxx"
                const match = createError.message.match(/customer of id ([a-z0-9_]+)/i)
                if (match && match[1]) {
                  customerId = match[1]
                  console.log('Using customer ID from conflict error:', customerId)
                } else {
                  // Try listing again - sometimes the list doesn't return all results immediately
                  console.log('Retrying customer list after conflict...')
                  await new Promise(resolve => setTimeout(resolve, 1000)) // Wait a bit
                  const retryCustomers = await paddle.customers.list({
                    email: data.customerEmail,
                  })
                  if (retryCustomers && retryCustomers.data && retryCustomers.data.length > 0) {
                    customerId = retryCustomers.data[0].id
                    console.log('Found customer on retry:', customerId)
                  } else {
                    throw createError
                  }
                }
              } else {
                throw createError
              }
            }
          }
        } catch (customerError: any) {
          console.error('Error creating/finding customer:', customerError)
          // If it's a conflict error, try to extract the customer ID
          if (customerError.message && customerError.message.includes('conflicts with customer')) {
            const match = customerError.message.match(/customer of id ([a-z0-9_]+)/i)
            if (match && match[1]) {
              customerId = match[1]
              console.log('Using customer ID from conflict error:', customerId)
            } else {
              throw customerError
            }
          } else {
            throw customerError
          }
        }
      }

      if (!customerId) {
        throw new Error('Failed to create or find customer')
      }

      // Paddle SDK v3 doesn't have subscriptions.create method
      // Use REST API directly to create subscription
      const requestBody = {
        customer_id: customerId,
        items: [{
          price_id: data.priceId,
          quantity: 1
        }],
        custom_data: {
          user_id: data.customerId,
          user_email: data.customerEmail
        }
      }

      console.log('Creating subscription via REST API:', { customerId, priceId: data.priceId })

      const subscriptionResponse = await fetch(`${this.baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Paddle-Version': '1'
        },
        body: JSON.stringify(requestBody)
      })

      const responseData = await subscriptionResponse.json().catch(() => ({}))

      if (!subscriptionResponse.ok) {
        console.error('Paddle API error:', responseData)
        const errorMessage = responseData.error?.detail || 
                           responseData.error?.message || 
                           responseData.errors?.[0]?.detail ||
                           `Failed to create subscription: ${subscriptionResponse.statusText}`
        throw new Error(errorMessage)
      }

      // Paddle API returns data in nested structure: { data: { id, status, ... } }
      const subscription = responseData.data || responseData

      // Calculate trial end date (7 days from now if not provided by Paddle)
      const trialEndDate = data.trialDays 
        ? new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days

      console.log('✅ Subscription created via REST API:', subscription.id)

      return {
        subscriptionId: subscription.id,
        customerId: customerId,
        status: subscription.status || 'trialing',
        trialEndsAt: subscription.trial_ends_at || subscription.trialEndsAt || trialEndDate.toISOString(),
        nextBilledAt: subscription.next_billed_at || subscription.nextBilledAt || subscription.next_billed_at || null
      }
    } catch (error: any) {
      console.error('Error creating Paddle subscription:', error)
      throw new Error(`Failed to create subscription: ${error.message || 'Unknown error'}`)
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!paddleConfig.webhookSecret || !signature) {
      return false
    }

    try {
      const crypto = require('crypto')
      const hmac = crypto.createHmac('sha256', paddleConfig.webhookSecret)
      hmac.update(body)
      const computedSignature = hmac.digest('hex')
      
      // Paddle sends signature as "sha256=<hash>"
      const receivedHash = signature.replace('sha256=', '')
      
      return crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(receivedHash)
      )
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string) {
    const paddle = this.ensureSDKInitialized()
    const subscription = await paddle.subscriptions.get(subscriptionId)
    
    // Format the response to match our expected structure
    return {
      id: subscription.id,
      status: subscription.status,
      customerId: (subscription as any).customer_id || subscription.customerId,
      trialEndsAt: (subscription as any).trial_end || (subscription as any).trialEndsAt || null,
      nextBilledAt: (subscription as any).next_billed_at || (subscription as any).nextBilledAt || null
    }
  }

  // Get customer details
  async getCustomer(customerId: string) {
    const paddle = this.ensureSDKInitialized()
    const customer = await paddle.customers.get(customerId)
    return {
      id: customer.id,
      email: (customer as any).email || customer.email,
      name: (customer as any).name || customer.name
    }
  }

  // List subscriptions for a customer
  async listSubscriptions(customerId: string) {
    const paddle = this.ensureSDKInitialized()
    return await paddle.subscriptions.list({
      customerId: customerId
    })
  }

  // Find subscription by customer email
  async findSubscriptionByEmail(email: string) {
    const paddle = this.ensureSDKInitialized()
    
    // First find customer by email
    const customers = await paddle.customers.list({
      email: email
    })
    
    if (!customers || !customers.data || customers.data.length === 0) {
      return null
    }
    
    const customerId = customers.data[0].id
    
    // Then find subscriptions for this customer
    const subscriptions = await paddle.subscriptions.list({
      customerId: customerId
    })
    
    if (!subscriptions || !subscriptions.data || subscriptions.data.length === 0) {
      return null
    }
    
    // Return the most recent active/trialing subscription
    const activeSub = subscriptions.data.find((sub: any) => 
      sub.status === 'active' || sub.status === 'trialing'
    ) || subscriptions.data[0]
    
    return {
      subscriptionId: activeSub.id,
      customerId: customerId,
      status: activeSub.status
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    const paddle = this.ensureSDKInitialized()
    return await paddle.subscriptions.cancel(subscriptionId)
  }
}

export const paddleAPI = new PaddleAPI()

// Helper function to update user subscription in database
export async function updateUserSubscription(
  userId: string, 
  updates: {
    subscription_status?: 'active' | 'cancelled' | 'trial' | 'free' | 'expired' | 'past_due'
    paddle_subscription_id?: string | null
    paddle_customer_id?: string | null
    subscription_ends_at?: string | null
    trial_ends_at?: string | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user subscription:', error)
    throw error
  }

  return { success: true }
}

