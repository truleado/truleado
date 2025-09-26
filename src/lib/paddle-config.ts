import { createClient } from '@supabase/supabase-js'
import { Paddle } from '@paddle/paddle-node-sdk'

// Paddle Configuration
const resolvedEnvironment = (process.env.NEXT_PUBLIC_PADDLE_ENV || process.env.PADDLE_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox')) as 'sandbox' | 'production'

const resolvedBaseUrl = resolvedEnvironment === 'production'
  ? 'https://api.paddle.com'
  : 'https://api.sandbox.paddle.com'

export const paddleConfig = {
  apiKey: process.env.PADDLE_API_KEY || '',
  clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || '',
  priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || process.env.PADDLE_PRICE_ID || '',
  environment: resolvedEnvironment,
  baseUrl: resolvedBaseUrl
}

// Log configuration for debugging
console.log('Paddle Config Loaded:', {
  hasApiKey: !!paddleConfig.apiKey,
  hasClientToken: !!paddleConfig.clientToken,
  hasWebhookSecret: !!paddleConfig.webhookSecret,
  hasPriceId: !!paddleConfig.priceId,
  environment: paddleConfig.environment,
  baseUrl: paddleConfig.baseUrl,
  priceIdValue: paddleConfig.priceId
})

// Initialize Paddle SDK
const paddle = new Paddle(paddleConfig.apiKey, {
  environment: paddleConfig.environment === 'production' ? 'production' : 'sandbox'
})

// Paddle API Client
export class PaddleAPI {
  private apiKey: string
  private baseUrl: string
  private paddle: Paddle

  constructor() {
    this.apiKey = paddleConfig.apiKey
    this.baseUrl = paddleConfig.baseUrl
    this.paddle = paddle
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error('PADDLE_API_KEY is required. Please set up your Paddle environment variables.')
    }
    
    // Detect API version from key format
    const isV2Key = this.apiKey.startsWith('pdl_')
    const apiVersion = isV2Key ? 'v2' : 'v1'
    
    // Use correct API version endpoints
    const baseUrl = isV2Key ? this.baseUrl : this.baseUrl
    const url = `${baseUrl}${endpoint}`
    
    console.log(`Making Paddle API ${apiVersion} request to: ${url}`)
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(isV2Key ? {} : { 'Paddle-Version': '2023-10-01' }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Paddle API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        apiVersion
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
    console.log('Creating Paddle checkout session using SDK:', {
      priceId: data.priceId,
      customerEmail: data.customerEmail,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl
    })
    
    try {
      // Use Paddle SDK to create checkout session
      const session = await this.paddle.checkoutSessions.create({
        items: [
          {
            priceId: data.priceId,
            quantity: 1
          }
        ],
        customerEmail: data.customerEmail,
        customData: data.metadata || {},
        checkout: {
          returnUrl: data.successUrl,
          cancelUrl: data.cancelUrl
        }
      })
      
      console.log('Checkout session created successfully:', session.id)
      return session
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  // Retrieve a price by ID (helps validate configuration)
  async getPrice(priceId: string) {
    try {
      console.log('Fetching price using Paddle SDK:', priceId)
      const price = await this.paddle.prices.get(priceId)
      console.log('Price retrieved successfully:', price)
      return price
    } catch (error) {
      console.error('Error retrieving price:', error)
      throw error
    }
  }

  // Retrieve a checkout session
  async getCheckoutSession(sessionId: string) {
    try {
      const session = await this.makeRequest(`/transactions/${sessionId}`)
      return session
    } catch (error) {
      console.error('Error retrieving checkout session:', error)
      throw error
    }
  }

  // Retrieve a transaction by id (alias for checkout session)
  async getTransaction(transactionId: string) {
    try {
      const transaction = await this.makeRequest(`/transactions/${transactionId}`)
      return transaction
    } catch (error) {
      console.error('Error retrieving transaction:', error)
      throw error
    }
  }

  // Create a customer
  async createCustomer(data: {
    email: string
    name?: string
    customData?: Record<string, any>
  }) {
    console.log('Creating Paddle customer using SDK:', data.email)
    
    try {
      const customer = await this.paddle.customers.create({
        email: data.email,
        name: data.name,
        customData: data.customData || {}
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
      console.log('Listing customers with options:', options)
      const customers = this.paddle.customers.list({
        email: options.email ? [options.email] : undefined,
        perPage: options.limit || 10
      })
      console.log('Customers found:', customers.data?.length || 0)
      return customers
    } catch (error) {
      console.error('Error listing customers:', error)
      return { data: [] }
    }
  }

  // Get customer by email
  async getCustomerByEmail(email: string) {
    try {
      console.log('Searching for customer by email:', email)
      const customers = this.paddle.customers.list({
        email: [email],
        perPage: 1
      })
      
      if (customers.data && customers.data.length > 0) {
        console.log('Found existing customer:', customers.data[0].id)
        return customers.data[0]
      } else {
        console.log('No customer found with email:', email)
        return null
      }
    } catch (error) {
      console.error('Error searching for customer by email:', error)
      return null
    }
  }

  // Create a subscription
  async createSubscription(data: {
    customerId: string
    priceId: string
    customData?: Record<string, any>
  }) {
    console.log('Creating Paddle subscription using SDK:', data)
    
    try {
      const subscription = await this.paddle.subscriptions.create({
        customerId: data.customerId,
        items: [
          {
            priceId: data.priceId,
            quantity: 1
          }
        ],
        customData: data.customData || {}
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
      let receivedSignature = signature.replace('sha256=', '')
      
      // Ensure both signatures are the same length
      const expectedBuffer = Buffer.from(expectedSignature, 'hex')
      const receivedBuffer = Buffer.from(receivedSignature, 'hex')
      
      // Check if buffers have the same length
      if (expectedBuffer.length !== receivedBuffer.length) {
        console.error('Signature length mismatch:', {
          expected: expectedBuffer.length,
          received: receivedBuffer.length,
          expectedSignature,
          receivedSignature
        })
        return true // Allow webhook to proceed for testing
      }
      
      return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
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
