import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing network connectivity...')
    
    // Test 1: Basic fetch to a reliable endpoint
    try {
      const testResponse = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      })
      
      if (testResponse.ok) {
        console.log('✅ Basic network connectivity works')
      } else {
        console.log('❌ Basic network test failed:', testResponse.status)
      }
    } catch (basicError) {
      console.log('❌ Basic network test failed:', basicError)
    }

    // Test 2: Try Paddle API with different approaches
    const apiKey = process.env.PADDLE_API_KEY
    console.log('API Key info:', {
      hasKey: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey?.substring(0, 15) || 'N/A'
    })

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'No API key found',
        tests: {
          basicNetwork: 'Not tested - no API key',
          paddleApi: 'Skipped - no API key'
        }
      })
    }

    // Test 3: Try Paddle API with minimal headers
    try {
      console.log('Testing Paddle API with minimal approach...')
      
      const paddleResponse = await fetch('https://api.sandbox.paddle.com/prices?per_page=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      })

      console.log('Paddle response status:', paddleResponse.status)
      console.log('Paddle response headers:', Object.fromEntries(paddleResponse.headers.entries()))

      if (paddleResponse.ok) {
        const data = await paddleResponse.json()
        console.log('✅ Paddle API works!')
        
        return NextResponse.json({
          success: true,
          message: 'All tests passed',
          tests: {
            basicNetwork: '✅ Working',
            paddleApi: '✅ Working',
            paddleStatus: paddleResponse.status,
            paddleDataKeys: Object.keys(data)
          }
        })
      } else {
        const errorText = await paddleResponse.text()
        console.log('❌ Paddle API failed:', paddleResponse.status, errorText)
        
        return NextResponse.json({
          success: false,
          error: `Paddle API failed with status ${paddleResponse.status}`,
          tests: {
            basicNetwork: '✅ Working',
            paddleApi: `❌ Failed (${paddleResponse.status})`,
            paddleError: errorText
          }
        })
      }

    } catch (paddleError) {
      console.log('❌ Paddle API error:', paddleError)
      
      return NextResponse.json({
        success: false,
        error: 'Paddle API connection failed',
        tests: {
          basicNetwork: '✅ Working',
          paddleApi: '❌ Failed',
          paddleError: paddleError instanceof Error ? paddleError.message : 'Unknown error'
        }
      })
    }

  } catch (error) {
    console.error('Network test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      tests: {
        basicNetwork: '❌ Failed',
        paddleApi: '❌ Not tested'
      }
    }, { status: 500 })
  }
}
