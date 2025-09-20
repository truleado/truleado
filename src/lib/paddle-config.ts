export const paddleConfig = {
  vendorId: process.env.PADDLE_VENDOR_ID!,
  apiKey: process.env.PADDLE_API_KEY!,
  productId: process.env.PADDLE_PRODUCT_ID!,
  priceId: process.env.PADDLE_PRICE_ID!,
  environment: 'production', // Force production for testing
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET!,
  
  // Trial settings
  trialDays: 1,
  monthlyPrice: 30,
  
  // Security settings
  maxTrialPerEmail: 1,
  maxTrialPerIP: 3,
  trialCooldownHours: 24
}

export const getPaddleCheckoutUrl = (userId: string, userEmail: string) => {
  // Use direct Paddle checkout URL for both sandbox and production
  return `https://buy.paddle.com/product/${paddleConfig.productId}?` +
    `customer_email=${encodeURIComponent(userEmail)}&` +
    `customer_id=${encodeURIComponent(userId)}&` +
    `return_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/billing/success`)}&` +
    `cancel_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`)}`
}

// Webhook signature verification
export function verifyPaddleWebhook(body: string, signature: string, secret: string): boolean {
  try {
    const crypto = require('crypto')
    
    // Paddle sends the signature in the format: "ts=timestamp;h1=hash"
    const parts = signature.split(';')
    const timestamp = parts.find(part => part.startsWith('ts='))?.split('=')[1]
    const hash = parts.find(part => part.startsWith('h1='))?.split('=')[1]
    
    if (!timestamp || !hash) {
      console.error('Invalid signature format')
      return false
    }
    
    // Create the expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(timestamp + ':' + body)
      .digest('hex')
    
    // Compare signatures using constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

// Paddle API integration
export class PaddleAPI {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = paddleConfig.environment === 'production' 
      ? 'https://api.paddle.com' 
      : 'https://sandbox-api.paddle.com'
    this.apiKey = paddleConfig.apiKey
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`Paddle API error: ${response.status} ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Paddle API request failed:', error)
      throw error
    }
  }

  // Get customer by ID
  async getCustomer(customerId: string) {
    return this.makeRequest(`/customers/${customerId}`)
  }

  // Create customer
  async createCustomer(email: string, name?: string, customData?: any) {
    return this.makeRequest('/customers', 'POST', {
      email,
      name,
      custom_data: customData
    })
  }

  // Update customer
  async updateCustomer(customerId: string, data: any) {
    return this.makeRequest(`/customers/${customerId}`, 'PATCH', data)
  }

  // Get subscription by ID
  async getSubscription(subscriptionId: string) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`)
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, effectiveFrom: 'next_billing_period' | 'immediately' = 'next_billing_period') {
    return this.makeRequest(`/subscriptions/${subscriptionId}/cancel`, 'POST', {
      effective_from: effectiveFrom
    })
  }

  // Pause subscription
  async pauseSubscription(subscriptionId: string, effectiveFrom: 'next_billing_period' | 'immediately' = 'next_billing_period') {
    return this.makeRequest(`/subscriptions/${subscriptionId}/pause`, 'POST', {
      effective_from: effectiveFrom
    })
  }

  // Resume subscription
  async resumeSubscription(subscriptionId: string) {
    return this.makeRequest(`/subscriptions/${subscriptionId}/resume`, 'POST')
  }

  // Get transaction by ID
  async getTransaction(transactionId: string) {
    return this.makeRequest(`/transactions/${transactionId}`)
  }

  // List transactions
  async listTransactions(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString()
    return this.makeRequest(`/transactions${queryParams ? `?${queryParams}` : ''}`)
  }
}

// Export a singleton instance
export const paddleAPI = new PaddleAPI()
