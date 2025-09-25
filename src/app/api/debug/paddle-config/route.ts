import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Paddle Debug Check')
    
    const config = {
      hasApiKey: !!paddleConfig.apiKey,
      hasClientToken: !!paddleConfig.clientToken,
      hasWebhookSecret: !!paddleConfig.webhookSecret,
      hasPriceId: !!paddleConfig.priceId,
      environment: paddleConfig.environment,
      baseUrl: paddleConfig.baseUrl,
      priceIdValue: paddleConfig.priceId,
      apiKeyLength: paddleConfig.apiKey?.length || 0,
      clientTokenLength: paddleConfig.clientToken?.length || 0
    }
    
    console.log('Paddle Configuration:', config)
    
    // Test API connectivity
    let apiTest = { success: false, error: null }
    if (paddleConfig.apiKey) {
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
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          apiTest.error = `HTTP ${response.status}: ${errorData.error?.detail || response.statusText}`
        }
      } catch (error) {
        apiTest.error = error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    return NextResponse.json({
      config,
      apiTest,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Debug failed'
    }, { status: 500 })
  }
}
