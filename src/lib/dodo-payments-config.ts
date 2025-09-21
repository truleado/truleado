import { createClient } from '@supabase/supabase-js'

// Dodo Payments Configuration
export const dodoPaymentsConfig = {
  apiKey: process.env.DODO_PAYMENTS_API_KEY!,
  webhookSecret: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
  productId: process.env.DODO_PAYMENTS_PRODUCT_ID!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.dodopayments.com' 
    : 'https://api.dodopayments.com'
}

// Dodo Payments API Client
export class DodoPaymentsAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = dodoPaymentsConfig.apiKey
    this.baseUrl = dodoPaymentsConfig.baseUrl
    
    if (!this.apiKey) {
      throw new Error('DODO_PAYMENTS_API_KEY is required')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
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
      throw new Error(`Dodo Payments API Error: ${response.status} - ${errorData.message || response.statusText}`)
    }

    return response.json()
  }

  // Create a checkout session
  async createCheckoutSession(data: {
    productId: string
    customerEmail: string
    customerName?: string
    successUrl: string
    cancelUrl: string
    metadata?: Record<string, any>
  }) {
    console.log('Creating Dodo Payments checkout session:', data)
    
    try {
      const session = await this.makeRequest('/v1/checkout_sessions', {
        method: 'POST',
        body: JSON.stringify({
          product_cart: [
            {
              product_id: data.productId,
              quantity: 1
            }
          ],
          customer: {
            email: data.customerEmail,
            name: data.customerName
          },
          return_url: data.successUrl,
          metadata: data.metadata || {}
        })
      })
      
      console.log('Checkout session created successfully:', session.session_id)
      return session
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  // Retrieve a checkout session
  async getCheckoutSession(sessionId: string) {
    try {
      const session = await this.makeRequest(`/v1/checkout/sessions/${sessionId}`)
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
    metadata?: Record<string, any>
  }) {
    console.log('Creating Dodo Payments customer:', data.email)
    
    try {
      const customer = await this.makeRequest('/v1/customers', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          metadata: data.metadata || {}
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
      const customer = await this.makeRequest(`/v1/customers/${customerId}`)
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
      if (options.limit) params.append('limit', options.limit.toString())
      
      const customers = await this.makeRequest(`/v1/customers?${params.toString()}`)
      return customers
    } catch (error) {
      console.error('Error listing customers:', error)
      // Return empty result if customers endpoint doesn't exist
      return { data: [] }
    }
  }

  // Create a subscription
  async createSubscription(data: {
    customerId: string
    productId: string
    metadata?: Record<string, any>
  }) {
    console.log('Creating Dodo Payments subscription:', data)
    
    try {
      const subscription = await this.makeRequest('/v1/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: data.customerId,
          product_id: data.productId,
          metadata: data.metadata || {}
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
      const subscription = await this.makeRequest(`/v1/subscriptions/${subscriptionId}`)
      return subscription
    } catch (error) {
      console.error('Error retrieving subscription:', error)
      throw error
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId: string) {
    console.log('Cancelling Dodo Payments subscription:', subscriptionId)
    
    try {
      const subscription = await this.makeRequest(`/v1/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST'
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
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', dodoPaymentsConfig.webhookSecret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
}

// Initialize the API client
export const dodoPaymentsAPI = new DodoPaymentsAPI()

// Helper function to update user subscription in Supabase
export async function updateUserSubscription(
  userId: string, 
  subscriptionData: {
    subscription_status: 'active' | 'cancelled' | 'trial' | 'free'
    dodo_customer_id?: string
    dodo_subscription_id?: string
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
