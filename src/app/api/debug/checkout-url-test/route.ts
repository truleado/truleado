import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing checkout URL generation...')
    
    // Test data
    const testData = {
      priceId: paddleConfig.priceId,
      customerEmail: 'test@example.com',
      successUrl: 'https://www.truleado.com/billing/success',
      cancelUrl: 'https://www.truleado.com/billing/cancel',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    }

    console.log('Test data:', testData)

    // Create checkout session
    const session = await paddleAPI.createCheckoutSession(testData)
    
    console.log('Raw session response:', JSON.stringify(session, null, 2))

    // Extract checkout URL
    const sessionId = session?.id || session?.data?.id
    let checkoutUrl = null
    
    if (session?.checkout_url) {
      checkoutUrl = session.checkout_url
    } else if (session?.url) {
      checkoutUrl = session.url
    } else if (session?.redirect_url) {
      checkoutUrl = session.redirect_url
    } else if (session?.data?.checkout_url) {
      checkoutUrl = session.data.checkout_url
    } else if (session?.data?.url) {
      checkoutUrl = session.data.url
    } else if (session?.data?.attributes?.url) {
      checkoutUrl = session.data.attributes.url
    } else if (session?.data?.attributes?.checkout_url) {
      checkoutUrl = session.data.attributes.checkout_url
    } else if (session?.links?.checkout) {
      checkoutUrl = session.links.checkout
    } else if (session?.links?.self) {
      checkoutUrl = session.links.self
    }

    // Test the checkout URL
    let urlTest = null
    if (checkoutUrl) {
      try {
        console.log('Testing checkout URL:', checkoutUrl)
        const response = await fetch(checkoutUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Truleado-Debug/1.0'
          }
        })
        
        urlTest = {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Could not read error response')
          urlTest.error = errorText
        }
      } catch (error) {
        urlTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : typeof error
        }
      }
    }

    return NextResponse.json({
      success: true,
      testData,
      session: {
        id: sessionId,
        checkoutUrl,
        rawResponse: session
      },
      urlTest,
      config: {
        hasApiKey: !!paddleConfig.apiKey,
        hasPriceId: !!paddleConfig.priceId,
        environment: paddleConfig.environment,
        baseUrl: paddleConfig.baseUrl
      }
    })

  } catch (error) {
    console.error('Checkout URL test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
      config: {
        hasApiKey: !!paddleConfig.apiKey,
        hasPriceId: !!paddleConfig.priceId,
        environment: paddleConfig.environment,
        baseUrl: paddleConfig.baseUrl
      }
    }, { status: 500 })
  }
}
