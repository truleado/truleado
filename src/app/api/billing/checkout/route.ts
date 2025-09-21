import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { dodoPaymentsAPI, dodoPaymentsConfig } from '@/lib/dodo-payments-config'

export async function POST(request: NextRequest) {
  try {
    console.log('Dodo Payments Checkout API called')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // For now, we'll skip customer creation and use metadata instead
    // Dodo Payments handles customer creation automatically
    console.log('Skipping customer creation, using metadata for user:', user.email)

    // Create checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`
    
    console.log('Creating checkout session for user:', user.id, 'with product:', dodoPaymentsConfig.productId)
    const session = await dodoPaymentsAPI.createCheckoutSession({
      productId: dodoPaymentsConfig.productId,
      customerEmail: user.email!,
      customerName: user.user_metadata?.full_name,
      successUrl,
      cancelUrl,
      metadata: {
        user_id: user.id,
        user_email: user.email
      }
    })
    
    console.log('Checkout session created:', session.session_id)

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
      checkout_url: session.checkout_url,
      session_id: session.session_id
    })

  } catch (error) {
    console.error('Checkout error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create checkout session'
    }, { status: 500 })
  }
}
