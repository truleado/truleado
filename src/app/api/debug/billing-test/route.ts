import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test 1: Check Paddle configuration
    const configTest = {
      hasApiKey: !!paddleConfig.apiKey,
      hasClientToken: !!paddleConfig.clientToken,
      hasPriceId: !!paddleConfig.priceId,
      environment: paddleConfig.environment,
      baseUrl: paddleConfig.baseUrl,
      priceIdValue: paddleConfig.priceId
    }

    // Test 2: Validate price configuration
    let priceTest = { success: false, error: null, price: null }
    try {
      const price = await paddleAPI.getPrice(paddleConfig.priceId)
      priceTest = {
        success: true,
        error: null,
        price: {
          id: price.id,
          type: price.type,
          billing_cycle: price.billing_cycle,
          interval: price.interval,
          unit_price: price.unit_price,
          currency_code: price.currency_code
        }
      }
    } catch (error) {
      priceTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        price: null
      }
    }

    // Test 3: Check user subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, paddle_customer_id, paddle_subscription_id, subscription_ends_at')
      .eq('id', user.id)
      .single()

    const subscriptionTest = {
      success: !profileError,
      error: profileError?.message || null,
      data: profile || null
    }

    // Test 4: Test Paddle API connectivity
    let apiTest = { success: false, error: null }
    try {
      const response = await fetch(`${paddleConfig.baseUrl}/customers?per_page=1`, {
        headers: {
          'Authorization': `Bearer ${paddleConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      apiTest = {
        success: response.ok,
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (error) {
      apiTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Overall test results
    const allTestsPass = configTest.hasApiKey && configTest.hasPriceId && priceTest.success && apiTest.success

    return NextResponse.json({
      overall_status: allTestsPass ? 'PASS' : 'FAIL',
      user_id: user.id,
      user_email: user.email,
      tests: {
        config: configTest,
        price: priceTest,
        subscription: subscriptionTest,
        api_connectivity: apiTest
      },
      recommendations: getRecommendations(configTest, priceTest, subscriptionTest, apiTest),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test failed',
      overall_status: 'ERROR'
    }, { status: 500 })
  }
}

function getRecommendations(config: any, price: any, subscription: any, api: any) {
  const recommendations = []

  if (!config.hasApiKey) {
    recommendations.push('❌ Set PADDLE_API_KEY environment variable')
  }
  if (!config.hasPriceId) {
    recommendations.push('❌ Set NEXT_PUBLIC_PADDLE_PRICE_ID environment variable')
  }
  if (!config.hasClientToken) {
    recommendations.push('⚠️ Set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN for client-side checkout')
  }
  if (!price.success) {
    recommendations.push('❌ Fix Paddle price configuration - check API key and price ID')
  } else if (price.price?.type !== 'recurring') {
    recommendations.push('❌ CRITICAL: Price must be configured for recurring billing in Paddle Dashboard')
  }
  if (!api.success) {
    recommendations.push('❌ Fix Paddle API connectivity - check API key and network')
  }
  if (subscription.success && subscription.data?.subscription_status === 'active' && !subscription.data?.paddle_subscription_id) {
    recommendations.push('⚠️ Active subscription missing paddle_subscription_id - may not have recurring billing')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All tests passed! Billing should work correctly.')
  }

  return recommendations
}
