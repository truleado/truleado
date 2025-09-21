import Razorpay from 'razorpay'

// Razorpay configuration
export const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID!,
  keySecret: process.env.RAZORPAY_KEY_SECRET!,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET!,
  planId: process.env.RAZORPAY_PLAN_ID!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
}

// Initialize Razorpay instance (only if keys are available)
export const razorpay = razorpayConfig.keyId && razorpayConfig.keySecret 
  ? new Razorpay({
      key_id: razorpayConfig.keyId,
      key_secret: razorpayConfig.keySecret
    })
  : null

// Generate Razorpay checkout URL
export const getRazorpayCheckoutUrl = (userId: string, userEmail: string) => {
  // For Razorpay, we'll use their checkout API
  // This will be handled in the checkout route
  return `/api/billing/checkout`
}

// Verify Razorpay webhook signature
export function verifyRazorpayWebhook(body: string, signature: string, secret: string): boolean {
  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Error verifying Razorpay webhook signature:', error)
    return false
  }
}

// Razorpay API class for subscription management
export class RazorpayAPI {
  private instance: Razorpay | null

  constructor() {
    this.instance = razorpay
    if (!this.instance) {
      console.warn('Razorpay not initialized - missing API keys')
    }
  }

  private checkInitialized() {
    if (!this.instance) {
      throw new Error('Razorpay not initialized - missing API keys')
    }
  }

  // Create a customer
  async createCustomer(email: string, name?: string) {
    this.checkInitialized()
    try {
      console.log('Creating Razorpay customer:', { email, name })
      const customer = await this.instance!.customers.create({
        email,
        name: name || email.split('@')[0]
      })
      console.log('Customer created successfully:', customer.id)
      return customer
    } catch (error) {
      console.error('Error creating Razorpay customer:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      throw error
    }
  }

  // Get customer by ID
  async getCustomer(customerId: string) {
    this.checkInitialized()
    try {
      const customer = await this.instance!.customers.fetch(customerId)
      return customer
    } catch (error) {
      console.error('Error fetching Razorpay customer:', error)
      throw error
    }
  }

  // Create subscription
  async createSubscription(customerId: string, planId: string) {
    this.checkInitialized()
    try {
      console.log('Creating Razorpay subscription:', { customerId, planId })
      const subscription = await this.instance!.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 12, // 12 months
        quantity: 1
      } as any)
      console.log('Subscription created successfully:', subscription.id)
      return subscription
    } catch (error) {
      console.error('Error creating Razorpay subscription:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      throw error
    }
  }

  // Get subscription by ID
  async getSubscription(subscriptionId: string) {
    this.checkInitialized()
    try {
      const subscription = await this.instance!.subscriptions.fetch(subscriptionId)
      return subscription
    } catch (error) {
      console.error('Error fetching Razorpay subscription:', error)
      throw error
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    this.checkInitialized()
    try {
      const subscription = await this.instance!.subscriptions.cancel(subscriptionId)
      return subscription
    } catch (error) {
      console.error('Error cancelling Razorpay subscription:', error)
      throw error
    }
  }

  // Pause subscription
  async pauseSubscription(subscriptionId: string) {
    this.checkInitialized()
    try {
      const subscription = await this.instance!.subscriptions.pause(subscriptionId)
      return subscription
    } catch (error) {
      console.error('Error pausing Razorpay subscription:', error)
      throw error
    }
  }

  // Resume subscription
  async resumeSubscription(subscriptionId: string) {
    this.checkInitialized()
    try {
      const subscription = await this.instance!.subscriptions.resume(subscriptionId)
      return subscription
    } catch (error) {
      console.error('Error resuming Razorpay subscription:', error)
      throw error
    }
  }

  // Get payment by ID
  async getPayment(paymentId: string) {
    this.checkInitialized()
    try {
      const payment = await this.instance!.payments.fetch(paymentId)
      return payment
    } catch (error) {
      console.error('Error fetching Razorpay payment:', error)
      throw error
    }
  }

  // List payments
  async listPayments(options: any = {}) {
    this.checkInitialized()
    try {
      const payments = await this.instance!.payments.all(options)
      return payments
    } catch (error) {
      console.error('Error listing Razorpay payments:', error)
      throw error
    }
  }

  // Update subscription notes (for webhook processing)
  async updateSubscriptionNotes(subscriptionId: string, notes: any) {
    this.checkInitialized()
    try {
      const subscription = await this.instance!.subscriptions.update(subscriptionId, {
        notes: notes
      })
      return subscription
    } catch (error) {
      console.error('Error updating subscription notes:', error)
      throw error
    }
  }

  // List plans
  async listPlans(options: any = {}) {
    this.checkInitialized()
    try {
      const plans = await this.instance!.plans.all(options)
      return plans
    } catch (error) {
      console.error('Error listing plans:', error)
      throw error
    }
  }

  // Get plan by ID
  async getPlan(planId: string) {
    this.checkInitialized()
    try {
      const plan = await this.instance!.plans.fetch(planId)
      return plan
    } catch (error) {
      console.error('Error fetching plan:', error)
      throw error
    }
  }
}

export const razorpayAPI = new RazorpayAPI()
