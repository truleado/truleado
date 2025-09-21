import { NextRequest, NextResponse } from 'next/server'
import { razorpayConfig, razorpayAPI } from '@/lib/razorpay-config'

export async function GET(request: NextRequest) {
  try {
    // Check configuration
    const config = {
      keyId: razorpayConfig.keyId ? 'Set' : 'Missing',
      keySecret: razorpayConfig.keySecret ? 'Set' : 'Missing',
      planId: razorpayConfig.planId ? 'Set' : 'Missing',
      webhookSecret: razorpayConfig.webhookSecret ? 'Set' : 'Missing',
      environment: razorpayConfig.environment
    }

    // Test API connection with detailed error reporting
    const apiTests: any = {}

    try {
      await razorpayAPI.getCustomer('non-existent-customer-id')
      apiTests.customerApi = 'Working (expected 404)'
    } catch (error: any) {
      console.error('Customer API Error:', error)
      apiTests.customerApi = {
        status: 'Error',
        message: error?.message || 'Unknown error',
        code: error?.code || 'NO_CODE',
        details: error?.response?.data || 'No response data'
      }
    }

    try {
      await razorpayAPI.getPayment('non-existent-payment-id')
      apiTests.paymentApi = 'Working (expected 404)'
    } catch (error: any) {
      console.error('Payment API Error:', error)
      apiTests.paymentApi = {
        status: 'Error',
        message: error?.message || 'Unknown error',
        code: error?.code || 'NO_CODE',
        details: error?.response?.data || 'No response data'
      }
    }

    // Test plan access
    try {
      // Test with a simple API call to verify connectivity
      const plans = await razorpayAPI.listPlans()
      apiTests.planApi = 'Working'
    } catch (error: any) {
      console.error('Plan API Error:', error)
      apiTests.planApi = {
        status: 'Error',
        message: error?.message || 'Unknown error',
        code: error?.code || 'NO_CODE',
        details: error?.response?.data || 'No response data'
      }
    }

    return NextResponse.json({
      message: 'Razorpay Detailed Debug',
      timestamp: new Date().toISOString(),
      tests: { config, apiTests },
      instructions: [
        'Check the error details above to identify the specific issue',
        'Common issues:',
        '1. Invalid API keys (check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)',
        '2. Wrong environment (sandbox vs production)',
        '3. Invalid plan ID (check RAZORPAY_PLAN_ID)',
        '4. API key permissions (ensure keys have required permissions)',
        '5. Account status (ensure Razorpay account is active)'
      ]
    })
  } catch (error) {
    console.error('Razorpay debug error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Debug failed',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
