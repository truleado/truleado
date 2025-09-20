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

    // Test API connection
    const apiTests: any = {}

    try {
      await razorpayAPI.getCustomer('non-existent-customer-id')
      apiTests.customerApi = 'Working (expected 404)'
    } catch (error: any) {
      apiTests.customerApi = error.message.includes('404') ? 'Working (expected 404)' : `API Key Issue: ${error.message}`
    }

    try {
      await razorpayAPI.getPayment('non-existent-payment-id')
      apiTests.paymentApi = 'Working (expected 404)'
    } catch (error: any) {
      apiTests.paymentApi = error.message.includes('404') ? 'Working (expected 404)' : `API Key Issue: ${error.message}`
    }

    return NextResponse.json({
      message: 'Razorpay Integration Test',
      tests: { config, apiTests },
      instructions: [
        'If API tests show "Working (expected 404)", your API integration is working correctly',
        'If you see "API Key Issue", check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables',
        'If you see "Missing" for any config values, add them to your .env.local file',
        'Make sure you\'re using the correct environment (sandbox vs production)'
      ]
    })
  } catch (error) {
    console.error('Razorpay API test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}
