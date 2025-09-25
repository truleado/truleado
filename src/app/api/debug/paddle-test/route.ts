import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Paddle configuration...')
    
    // Test configuration
    const config = {
      apiKey: paddleConfig.apiKey ? 'Present' : 'Missing',
      clientToken: paddleConfig.clientToken ? 'Present' : 'Missing',
      webhookSecret: paddleConfig.webhookSecret ? 'Present' : 'Missing',
      priceId: paddleConfig.priceId ? 'Present' : 'Missing',
      environment: paddleConfig.environment,
      baseUrl: paddleConfig.baseUrl
    }
    
    console.log('Paddle Config:', config)
    
    // Test API connection
    try {
      const customers = await paddleAPI.listCustomers({ limit: 1 })
      console.log('API Test Success:', customers)
    } catch (apiError) {
      console.error('API Test Failed:', apiError)
      return NextResponse.json({
        config,
        apiError: apiError instanceof Error ? apiError.message : 'Unknown API error'
      })
    }
    
    return NextResponse.json({
      config,
      status: 'success',
      message: 'Paddle configuration is working'
    })
    
  } catch (error) {
    console.error('Paddle test error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed',
      config: {
        apiKey: paddleConfig.apiKey ? 'Present' : 'Missing',
        clientToken: paddleConfig.clientToken ? 'Present' : 'Missing',
        webhookSecret: paddleConfig.webhookSecret ? 'Present' : 'Missing',
        priceId: paddleConfig.priceId ? 'Present' : 'Missing',
        environment: paddleConfig.environment,
        baseUrl: paddleConfig.baseUrl
      }
    }, { status: 500 })
  }
}
