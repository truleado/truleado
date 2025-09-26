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

    // Create checkout session
    const originHeader = request.headers.get('origin') || request.headers.get('x-forwarded-host') || ''
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = originHeader && !originHeader.includes('http') ? `${protocol}://${originHeader}` : originHeader
    const baseUrl = host || process.env.NEXT_PUBLIC_APP_URL || ''
    const successUrl = `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/billing/cancel`
    
    console.log('Using URLs:', { baseUrl, successUrl, cancelUrl })
    
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
    const checkoutUrl = 
      session?.checkout_url ||
      session?.url ||
      session?.redirect_url ||
      session?.data?.checkout_url ||
      session?.data?.attributes?.url ||
      session?.links?.checkout ||
      session?.links?.self

    console.log('Checkout session created:', { sessionId, checkoutUrl })

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
    console.error('Checkout error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      hasApiKey: !!paddleConfig.apiKey,
      hasPriceId: !!paddleConfig.priceId,
      environment: paddleConfig.environment,
      error
    })
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create checkout session'
    }, { status: 500 })
  }
}
