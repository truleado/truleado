import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    console.log('Paddle Checkout API called')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    if (!paddleConfig.priceId) {
      console.error('Missing Paddle price ID')
      return NextResponse.json({ 
        error: 'Billing is temporarily unavailable. Missing price configuration.',
        details: 'NEXT_PUBLIC_PADDLE_PRICE_ID or PADDLE_PRICE_ID environment variable is not set',
        debug: 'Visit /api/debug/billing-config to check configuration status'
      }, { status: 500 })
    }
    if (!paddleConfig.apiKey) {
      console.error('Missing Paddle API key')
      return NextResponse.json({ 
        error: 'Billing is temporarily unavailable. Missing payment configuration.',
        details: 'PADDLE_API_KEY environment variable is not set',
        debug: 'Visit /api/debug/billing-config to check configuration status'
      }, { status: 500 })
    }

    // Create checkout session
    const originHeader = request.headers.get('origin') || request.headers.get('x-forwarded-host') || ''
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = originHeader && !originHeader.includes('http') ? `${protocol}://${originHeader}` : originHeader
    const baseUrl = host || process.env.NEXT_PUBLIC_APP_URL || ''
    // Use proper Paddle URL parameters
    const successUrl = `${baseUrl}/billing/success`
    const cancelUrl = `${baseUrl}/billing/cancel`
    
    console.log('Using URLs:', { baseUrl, successUrl, cancelUrl })
    
        console.log('Validating Paddle price:', paddleConfig.priceId)
        try {
          const price = await paddleAPI.getPrice(paddleConfig.priceId)
          console.log('Price details:', price)

          // Handle SDK response format
          const priceData = price
          const priceType = priceData.type
          const hasBillingCycle = priceData.billingCycle && priceData.billingCycle.interval
          // Paddle uses "standard" type for recurring prices with billing cycles
          const isRecurring = hasBillingCycle || priceType === 'recurring'

          console.log('Price validation:', {
            id: priceData.id,
            type: priceType,
            billingCycle: priceData.billingCycle,
            hasBillingCycle,
            isRecurring
          })

          // Ensure this is a recurring price (check for billing cycle)
          if (!isRecurring) {
            console.error('Price is not configured for recurring billing:', priceData)
            return NextResponse.json({ 
              error: 'Price not configured for recurring billing. Please contact support.',
              price: {
                id: priceData.id,
                type: priceData.type,
                billingCycle: priceData.billingCycle
              },
              recommendation: 'Configure this price as recurring in Paddle Dashboard'
            }, { status: 500 })
          }

          console.log('✅ Price validation passed - recurring billing configured')
        } catch (e) {
          console.error('Invalid or inaccessible price ID:', paddleConfig.priceId, e)
          return NextResponse.json({ error: 'Billing configuration error. Please contact support.' }, { status: 500 })
        }

    console.log('Creating checkout session for user:', user.id, 'with price:', paddleConfig.priceId)
    const session = await paddleAPI.createCheckoutSession({
      priceId: paddleConfig.priceId,
      customerEmail: user.email!,
      customerName: user.user_metadata?.full_name,
      successUrl,
      cancelUrl,
      metadata: {
        user_id: user.id,
        user_email: user.email
      }
    })
    
    const sessionId = session?.id || session?.data?.id
    
    // Extract checkout URL from various possible response formats
    let checkoutUrl = null
    
    // Try different possible locations for checkout URL
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

    console.log('Checkout session created:', { 
      sessionId, 
      checkoutUrl,
      rawSession: JSON.stringify(session, null, 2)
    })

    if (!checkoutUrl) {
      console.error('No checkout URL returned from Paddle. Raw session:', JSON.stringify(session))
      throw new Error('Checkout URL missing from Paddle response')
    }

    // Update user profile with session ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: 'pending'
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      // Don't fail the checkout for this, just log it
    }

    return NextResponse.json({
      checkout_url: checkoutUrl,
      session_id: sessionId
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create checkout session'
    console.error('Checkout error details:', {
      message,
      stack: error instanceof Error ? error.stack : undefined,
      hasApiKey: !!paddleConfig.apiKey,
      hasPriceId: !!paddleConfig.priceId,
      environment: paddleConfig.environment,
      error
    })

    // Normalize common Paddle errors into user-friendly responses
    const isAuthError = typeof message === 'string' && /401|unauthorized|api key/i.test(message)
    const isConfigError = !paddleConfig.apiKey || !paddleConfig.priceId
    const clientMessage = isConfigError
      ? 'Billing is temporarily unavailable. Please try again later.'
      : isAuthError
        ? 'Payment service authorization failed. Please try again shortly.'
        : 'Failed to create checkout session. Please try again.'

    return NextResponse.json({ 
      error: clientMessage,
      details: isConfigError ? 'Missing Paddle configuration. Check environment variables.' : undefined,
      debug: 'Visit /api/debug/billing-config to check configuration status'
    }, { status: 500 })
  }
}
