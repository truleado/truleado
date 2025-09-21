import { NextRequest, NextResponse } from 'next/server'
import { razorpayConfig } from '@/lib/razorpay-config'

export async function GET(request: NextRequest) {
  try {
    // Check API key format without exposing the actual keys
    const keyIdFormat = razorpayConfig.keyId ? {
      length: razorpayConfig.keyId.length,
      startsWith: razorpayConfig.keyId.substring(0, 8),
      endsWith: razorpayConfig.keyId.substring(razorpayConfig.keyId.length - 4),
      isTestKey: razorpayConfig.keyId.startsWith('rzp_test_'),
      isLiveKey: razorpayConfig.keyId.startsWith('rzp_live_')
    } : null

    const keySecretFormat = razorpayConfig.keySecret ? {
      length: razorpayConfig.keySecret.length,
      startsWith: razorpayConfig.keySecret.substring(0, 8),
      endsWith: razorpayConfig.keySecret.substring(razorpayConfig.keySecret.length - 4)
    } : null

    // Test the actual API call with detailed error info
    let apiTest = null
    try {
      const response = await fetch('https://api.razorpay.com/v1/plans', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${razorpayConfig.keyId}:${razorpayConfig.keySecret}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      apiTest = {
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        error: data.error || null,
        data: response.ok ? data : null
      }
    } catch (error: any) {
      apiTest = {
        error: error.message,
        success: false
      }
    }

    return NextResponse.json({
      message: 'Razorpay Diagnosis',
      timestamp: new Date().toISOString(),
      environment: razorpayConfig.environment,
      keyFormats: {
        keyId: keyIdFormat,
        keySecret: keySecretFormat
      },
      apiTest,
      recommendations: [
        'Check if API keys are in correct format (rzp_test_ for test, rzp_live_ for live)',
        'Verify API keys are from the correct Razorpay account',
        'Ensure Razorpay account is activated',
        'Check if API keys have required permissions',
        'Verify environment matches the key type (sandbox for test keys)'
      ]
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Diagnosis failed'
    }, { status: 500 })
  }
}
