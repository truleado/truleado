import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Paddle API connection...')
    
    // Test 1: Check configuration
    const config = {
      hasApiKey: !!paddleConfig.apiKey,
      hasClientToken: !!paddleConfig.clientToken,
      hasPriceId: !!paddleConfig.priceId,
      environment: paddleConfig.environment,
      baseUrl: paddleConfig.baseUrl,
      apiKeyLength: paddleConfig.apiKey?.length || 0,
      apiKeyPrefix: paddleConfig.apiKey?.substring(0, 10) || 'N/A'
    }

    console.log('Paddle config:', config)

    if (!paddleConfig.apiKey) {
      return NextResponse.json({
        success: false,
        error: 'PADDLE_API_KEY is not set',
        config
      })
    }

    // Test 2: Basic connectivity test
    const testUrl = `${paddleConfig.baseUrl}/customers?per_page=1`
    console.log('Testing URL:', testUrl)

    let connectivityTest = { success: false, error: null, status: null, response: null }
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paddleConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Paddle-Version': '2023-10-01'
        },
        // Add timeout and other options
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      connectivityTest = {
        success: response.ok,
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        response: response.ok ? 'Connected successfully' : `Error: ${response.statusText}`
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Paddle API error response:', errorText)
        connectivityTest.response = errorText
      }

    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      connectivityTest = {
        success: false,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        status: null,
        response: fetchError instanceof Error ? fetchError.stack : 'Unknown error'
      }
    }

    // Test 3: Try alternative API version
    let alternativeTest = { success: false, error: null }
    try {
      const altUrl = `${paddleConfig.baseUrl.replace('/api', '')}/api/v2/customers?per_page=1`
      console.log('Testing alternative URL:', altUrl)
      
      const altResponse = await fetch(altUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paddleConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      })

      alternativeTest = {
        success: altResponse.ok,
        error: altResponse.ok ? null : `HTTP ${altResponse.status}: ${altResponse.statusText}`
      }
    } catch (altError) {
      alternativeTest = {
        success: false,
        error: altError instanceof Error ? altError.message : 'Alternative test failed'
      }
    }

    // Test 4: Check if it's a DNS/network issue
    let dnsTest = { success: false, error: null }
    try {
      const dnsUrl = 'https://api.sandbox.paddle.com'
      const dnsResponse = await fetch(dnsUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      dnsTest = {
        success: true,
        error: null
      }
    } catch (dnsError) {
      dnsTest = {
        success: false,
        error: dnsError instanceof Error ? dnsError.message : 'DNS test failed'
      }
    }

    const overallSuccess = connectivityTest.success || alternativeTest.success

    return NextResponse.json({
      success: overallSuccess,
      config,
      tests: {
        connectivity: connectivityTest,
        alternative_api: alternativeTest,
        dns_resolution: dnsTest
      },
      recommendations: getRecommendations(config, connectivityTest, alternativeTest, dnsTest),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

function getRecommendations(config: any, connectivity: any, alternative: any, dns: any) {
  const recommendations = []

  if (!config.hasApiKey) {
    recommendations.push('❌ Set PADDLE_API_KEY environment variable')
  }
  if (!config.hasPriceId) {
    recommendations.push('❌ Set NEXT_PUBLIC_PADDLE_PRICE_ID environment variable')
  }
  if (config.apiKeyPrefix && !config.apiKeyPrefix.startsWith('sandbox_') && !config.apiKeyPrefix.startsWith('live_')) {
    recommendations.push('⚠️ API key format looks incorrect - should start with sandbox_ or live_')
  }
  if (!dns.success) {
    recommendations.push('❌ DNS resolution failed - check network connectivity')
  }
  if (!connectivity.success && !alternative.success) {
    recommendations.push('❌ Both API endpoints failed - check API key and network')
  }
  if (connectivity.error?.includes('401') || connectivity.error?.includes('403')) {
    recommendations.push('❌ Authentication failed - check API key permissions')
  }
  if (connectivity.error?.includes('404')) {
    recommendations.push('❌ API endpoint not found - check base URL configuration')
  }
  if (connectivity.error?.includes('timeout')) {
    recommendations.push('❌ Request timeout - check network or try again')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All connection tests passed!')
  }

  return recommendations
}
