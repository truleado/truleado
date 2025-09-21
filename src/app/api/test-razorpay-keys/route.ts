import { NextRequest, NextResponse } from 'next/server'
import { razorpayConfig } from '@/lib/razorpay-config'

export async function GET(request: NextRequest) {
  try {
    // Simple test to verify API keys are working
    const response = await fetch('https://api.razorpay.com/v1/plans', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${razorpayConfig.keyId}:${razorpayConfig.keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    return NextResponse.json({
      message: 'Razorpay API Key Test',
      timestamp: new Date().toISOString(),
      config: {
        keyId: razorpayConfig.keyId ? 'Set' : 'Missing',
        keySecret: razorpayConfig.keySecret ? 'Set' : 'Missing',
        environment: razorpayConfig.environment
      },
      apiResponse: {
        status: response.status,
        statusText: response.statusText,
        data: data
      }
    })
  } catch (error) {
    console.error('API key test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'API key test failed',
      config: {
        keyId: razorpayConfig.keyId ? 'Set' : 'Missing',
        keySecret: razorpayConfig.keySecret ? 'Set' : 'Missing',
        environment: razorpayConfig.environment
      }
    }, { status: 500 })
  }
}
