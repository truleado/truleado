import { NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET() {
  try {
    // Test Paddle API connection
    const apiUrl = paddleConfig.environment === 'production' 
      ? 'https://api.paddle.com/prices'
      : 'https://sandbox-api.paddle.com/prices'

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paddleConfig.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ 
        error: 'Paddle API test failed',
        details: errorData,
        status: response.status
      })
    }

    const data = await response.json()
    return NextResponse.json({ 
      success: true,
      message: 'Paddle API connection successful',
      data: data
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Paddle API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
