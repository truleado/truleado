import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Running simple Paddle API test...')
    
    const apiKey = process.env.PADDLE_API_KEY
    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID
    
    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 10) || 'N/A',
      hasPriceId: !!priceId,
      priceId: priceId?.substring(0, 10) || 'N/A'
    })

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'PADDLE_API_KEY not found in environment variables'
      })
    }

    // Test with a very simple request
    const testUrl = 'https://api.sandbox.paddle.com/prices'
    console.log('Testing URL:', testUrl)

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(15000)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('Success! Data keys:', Object.keys(data))
        
        return NextResponse.json({
          success: true,
          message: 'Paddle API connection successful',
          status: response.status,
          dataKeys: Object.keys(data),
          sampleData: data
        })
      } else {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        
        return NextResponse.json({
          success: false,
          error: `HTTP ${response.status}`,
          details: errorText,
          status: response.status
        })
      }

    } catch (fetchError) {
      console.error('Fetch error details:', {
        name: fetchError instanceof Error ? fetchError.name : 'Unknown',
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        stack: fetchError instanceof Error ? fetchError.stack : undefined
      })

      return NextResponse.json({
        success: false,
        error: 'Network error',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        errorType: fetchError instanceof Error ? fetchError.name : 'Unknown'
      })
    }

  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
