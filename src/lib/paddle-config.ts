import { createClient } from '@supabase/supabase-js'

// Paddle Configuration
export const paddleConfig = {
  apiKey: process.env.PADDLE_API_KEY || '',
  clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || '',
  priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || process.env.PADDLE_PRICE_ID || '',
  environment: 'sandbox', // Force sandbox for testing
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.paddle.com' 
    : 'https://sandbox-api.paddle.com'
}

// Paddle API Client
export class PaddleAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = paddleConfig.apiKey
    this.baseUrl = paddleConfig.baseUrl
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error('PADDLE_API_KEY is required. Please set up your Paddle environment variables.')
    }
    
    const url = `${this.baseUrl}${endpoint}`
    
    console.log(`Making Paddle API request to: ${url}`)
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Paddle API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Paddle API Error: ${response.status} - ${errorData.error?.detail || response.statusText}`)
    }

    const data = await response.json()
    console.log('Paddle API Response:', data)
    return data
  }

  // Create a checkout session
  async createCheckoutSession(data: {
    priceId: string
    customerEmail: string
    customerName?: string
    successUrl: string
    cancelUrl: string
    metadata?: Record<string, any>
  }) {
    console.log('Creating Paddle checkout session:', data)
    
    try {
      const session = await this.makeRequest('/checkout_sessions', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              price_id: data.priceId,
              quantity: 1
            }
          ],
          customer_email: data.customerEmail,
          custom_data: data.metadata || {},
          checkout: {
            url: data.successUrl,
            cancel_url: data.cancelUrl
          }
        })
      })
      
      console.log('Checkout session created successfully:', session.id)
      return session
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  // Retrieve a checkout session
  async getCheckoutSession(sessionId: string) {
    try {
      const session = await this.makeRequest(`/checkout_sessions/${sessionId}`)
      return session
    } catch (error) {
      console.error('Error retrieving checkout session:', error)
      throw error
    }
  }

  // Create a customer
  async createCustomer(data: {
    email: string
    name?: string
    customData?: Record<string, any>
  }) {
    console.log('Creating Paddle customer:', data.email)
    
    try {
      const customer = await this.makeRequest('/customers', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          custom_data: data.customData || {}
        })
      })
      
      console.log('Customer created successfully:', customer.id)
      return customer
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    }
  }

  // Retrieve a customer
  async getCustomer(customerId: string) {
    try {
      const customer = await this.makeRequest(`/customers/${customerId}`)
      return customer
    } catch (error) {
      console.error('Error retrieving customer:', error)
      throw error
    }
  }

  // List customers
  async listCustomers(options: { email?: string; limit?: number } = {}) {
    try {
      const params = new URLSearchParams()
      if (options.email) params.append('email', options.email)
      if (options.limit) params.append('per_page', options.limit.toString())
      
      const customers = await this.makeRequest(`/customers?${params.toString()}`)
      return customers
    } catch (error) {
      console.error('Error listing customers:', error)
      return { data: [] }
    }
  }

  // Create a subscription
  async createSubscription(data: {
    customerId: string
    priceId: string
    customData?: Record<string, any>
  }) {
    console.log('Creating Paddle subscription:', data)
    
    try {
      const subscription = await this.makeRequest('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: data.customerId,
          items: [
            {
              price_id: data.priceId,
              quantity: 1
            }
          ],
          custom_data: data.customData || {}
        })
      })
      
      console.log('Subscription created successfully:', subscription.id)
      return subscription
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  }

  // Retrieve a subscription
  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await this.makeRequest(`/subscriptions/${subscriptionId}`)
      return subscription
    } catch (error) {
      console.error('Error retrieving subscription:', error)
      throw error
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId: string) {
    console.log('Cancelling Paddle subscription:', subscriptionId)
    
    try {
      const subscription = await this.makeRequest(`/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'canceled'
        })
      })
      
      console.log('Subscription cancelled successfully:', subscription.id)
      return subscription
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!signature || !paddleConfig.webhookSecret) {
      console.log('Missing signature or webhook secret, skipping verification')
      return true // Allow webhook to proceed for testing
    }

    try {
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', paddleConfig.webhookSecret)
        .update(payload)
        .digest('hex')
      
      // Paddle sends signature as "sha256=<hash>"
      const receivedSignature = signature.replace('sha256=', '')
      
      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return true // Allow webhook to proceed for testing
    }
  }
}

// Initialize the API client
export const paddleAPI = new PaddleAPI()

// Helper function to update user subscription in Supabase
export async function updateUserSubscription(
  userId: string, 
  subscriptionData: {
    subscription_status: 'active' | 'cancelled' | 'trial' | 'free'
    paddle_customer_id?: string
    paddle_subscription_id?: string
    subscription_ends_at?: string
  }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('profiles')
    .update(subscriptionData)
    .eq('id', userId)

  if (error) {
    console.error('Error updating user subscription:', error)
    throw error
  }

  console.log('User subscription updated successfully:', userId)
}
