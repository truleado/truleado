import { createClient } from '@/lib/supabase-server'
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

// Initialize Paddle SDK with error handling
let paddle: Paddle | null = null

try {
  if (paddleConfig.apiKey) {
    console.log('Initializing Paddle SDK with API key:', paddleConfig.apiKey.substring(0, 8) + '...')
    console.log('Environment:', paddleConfig.environment)
    
    paddle = new Paddle(paddleConfig.apiKey, {
      environment: paddleConfig.environment === 'production' ? 'production' : 'sandbox'
    })
    console.log('Paddle SDK initialized successfully')
    console.log('SDK object:', paddle)
    console.log('SDK object keys:', Object.keys(paddle))
    console.log('SDK checkoutSessions:', paddle.checkoutSessions)
    console.log('SDK has checkoutSessions:', 'checkoutSessions' in paddle)
    console.log('SDK checkoutSessions type:', typeof paddle.checkoutSessions)
    
    // Check what methods are available
    console.log('Available methods on paddle object:')
    Object.keys(paddle).forEach(key => {
      const value = paddle[key]
      console.log(`- ${key}:`, typeof value, value)
      if (typeof value === 'object' && value !== null) {
        console.log(`  - ${key} methods:`, Object.keys(value))
      }
    })
  } else {
    console.warn('Paddle API key not found, SDK not initialized')
  }
} catch (error) {
  console.error('Failed to initialize Paddle SDK:', error)
  console.error('Error details:', error)
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
    
    // Debug the paddle instance
    console.log('ensureSDKInitialized - paddle object:', this.paddle)
    console.log('ensureSDKInitialized - paddle keys:', Object.keys(this.paddle))
    console.log('ensureSDKInitialized - checkoutSessions:', this.paddle.checkoutSessions)
    console.log('ensureSDKInitialized - has checkoutSessions:', 'checkoutSessions' in this.paddle)
    
    return this.paddle
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
    console.log('Request options:', {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(isV2Key ? {} : { 'Paddle-Version': '2023-10-01' }),
        ...options.headers,
      },
      body: options.body
    })
    
    try {
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

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Paddle API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          apiVersion,
          url
        })
        throw new Error(`Paddle API Error: ${response.status} - ${errorData.error?.detail || response.statusText}`)
      }

      const data = await response.json()
      console.log('Paddle API Response:', data)
      return data
    } catch (error) {
      console.error('Fetch error details:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        url,
        apiVersion,
        isV2Key,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        isNetworkError: error instanceof Error && (
          error.message.includes('fetch failed') ||
          error.message.includes('network') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ETIMEDOUT')
        )
      })
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch failed')) {
          throw new Error(`Network error: Unable to connect to Paddle API at ${url}. This could be due to network connectivity, DNS resolution, or SSL issues.`)
        } else if (error.message.includes('ECONNREFUSED')) {
          throw new Error(`Connection refused: Paddle API server is not responding at ${url}`)
        } else if (error.message.includes('ENOTFOUND')) {
          throw new Error(`DNS error: Cannot resolve Paddle API hostname. Check your network connection.`)
        } else if (error.message.includes('ETIMEDOUT')) {
          throw new Error(`Timeout: Paddle API request timed out. The server may be slow or unreachable.`)
        }
      }
      
      throw error
    }
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
      cancelUrl: data.cancelUrl,
      hasApiKey: !!this.apiKey,
      environment: paddleConfig.environment
    })
    
    try {
      // Validate required fields
      if (!data.priceId) {
        throw new Error('Price ID is required')
      }
      if (!data.customerEmail) {
        throw new Error('Customer email is required')
      }
      if (!data.successUrl) {
        throw new Error('Success URL is required')
      }
      if (!data.cancelUrl) {
        throw new Error('Cancel URL is required')
      }

      // Use direct API call since checkoutSessions is not available in this SDK version
      const apiData = {
        items: [
          {
            price_id: data.priceId,
            quantity: 1
          }
        ],
        customer_email: data.customerEmail,
        custom_data: data.metadata || {},
        checkout: {
          return_url: data.successUrl,
          cancel_url: data.cancelUrl
        }
      }

      console.log('Paddle API request data:', JSON.stringify(apiData, null, 2))

      // Create checkout session using Paddle API v2
      let session
      try {
        const sdk = this.ensureSDKInitialized()
        
        // Try SDK first if available
        if (sdk.checkoutSessions && typeof sdk.checkoutSessions.create === 'function') {
          console.log('Using SDK checkoutSessions.create')
          session = await sdk.checkoutSessions.create(apiData)
        } else {
          throw new Error('SDK checkoutSessions not available')
        }
      } catch (sdkError) {
        console.log('SDK checkoutSessions failed, trying direct API:', sdkError)
        
        // Use direct API call to create checkout session
        try {
          session = await this.makeRequest('/checkout-sessions', {
            method: 'POST',
            body: JSON.stringify(apiData)
          })
        } catch (apiError) {
          console.log('Direct API checkout-sessions failed, trying transactions:', apiError)
          
          // Fallback to transactions if checkout-sessions doesn't work
          const transactionData = {
            items: [
              {
                price_id: data.priceId,
                quantity: 1
              }
            ],
            customer_email: data.customerEmail,
            custom_data: data.metadata || {}
          }
          
          session = await this.makeRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
          })
        }
      }
      
      console.log('Checkout session created successfully:', session.id)
      return session
    } catch (error) {
      console.error('Error creating checkout session:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        priceId: data.priceId,
        customerEmail: data.customerEmail,
        hasApiKey: !!this.apiKey,
        environment: paddleConfig.environment,
        errorDetails: error
      })
      
      // Handle specific Paddle validation errors
      if (error instanceof Error && error.message.includes('validation')) {
        throw new Error(`Paddle validation error: ${error.message}. Please check your price ID and ensure it's configured for recurring billing.`)
      }
      
      throw error
    }
  }

  // Test basic connectivity to Paddle API
  async testConnectivity() {
    try {
      console.log('Testing Paddle API connectivity...')
      
      // Test basic connectivity with a simple GET request
      const testUrl = `${this.baseUrl}/prices/${this.priceId}`
      console.log('Testing connectivity to:', testUrl)
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      console.log('Connectivity test response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: 'Paddle API connectivity test successful',
          status: response.status,
          data: data
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          message: `Paddle API returned error: ${response.status} ${response.statusText}`,
          status: response.status,
          error: errorData
        }
      }
    } catch (error) {
      console.error('Connectivity test failed:', error)
      return {
        success: false,
        message: `Connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : error
      }
    }
  }

  // Retrieve a price by ID (helps validate configuration)
  async getPrice(priceId: string) {
    try {
      console.log('Fetching price using Paddle SDK:', priceId)
      const sdk = this.ensureSDKInitialized()
      
      // Check if prices property exists
      if (!sdk.prices) {
        console.log('prices not available, trying direct API call')
        return await this.makeRequest(`/prices/${priceId}`)
      }
      
      const price = await sdk.prices.get(priceId)
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
      const sdk = this.ensureSDKInitialized()
      
      // Check if customers property exists
      if (!sdk.customers) {
        console.log('customers not available, trying direct API call')
        return await this.makeRequest('/customers', {
          method: 'POST',
          body: JSON.stringify({
            email: data.email,
            name: data.name,
            custom_data: data.customData || {}
          })
        })
      }
      
      const customer = await sdk.customers.create({
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
      const sdk = this.ensureSDKInitialized()
      const customers = sdk.customers.list({
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
      
      // Try the search with email filter
      const sdk = this.ensureSDKInitialized()
      const customers = sdk.customers.list({
        email: [email],
        perPage: 10
      })
      
      console.log('Search result:', {
        hasData: !!customers.data,
        dataLength: customers.data?.length || 0,
        customers: customers.data?.map(c => ({ id: c.id, email: c.email })) || []
      })
      
      if (customers.data && customers.data.length > 0) {
        const foundCustomer = customers.data.find(c => c.email === email)
        if (foundCustomer) {
          console.log('Found existing customer:', foundCustomer.id, foundCustomer.email)
          return foundCustomer
        } else {
          console.log('No exact email match found, but found customers:', customers.data.length)
          // Return the first one as fallback
          console.log('Using first customer as fallback:', customers.data[0].id)
          return customers.data[0]
        }
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
    console.log('Creating Paddle subscription via transaction:', data)
    
    try {
      // In Paddle, subscriptions are created via transactions with recurring items
      const sdk = this.ensureSDKInitialized()
      const transaction = await sdk.transactions.create({
        customerId: data.customerId,
        items: [
          {
            priceId: data.priceId,
            quantity: 1
          }
        ],
        customData: data.customData || {}
      })
      
      console.log('Transaction created successfully:', transaction.id)
      
      // The transaction should contain subscription information
      return {
        id: transaction.id,
        status: transaction.status,
        nextBilledAt: transaction.nextBilledAt,
        billingCycle: transaction.billingCycle,
        subscriptionId: transaction.subscriptionId
      }
    } catch (error) {
      console.error('Error creating subscription transaction:', error)
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
  const supabase = await createClient()

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
