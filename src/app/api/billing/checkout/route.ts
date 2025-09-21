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

    // Create or get Dodo Payments customer
    let customer
    try {
      // Try to find existing customer by email first
      console.log('Looking for existing customer with email:', user.email)
      const customers = await dodoPaymentsAPI.listCustomers({ email: user.email! })
      
      if (customers.data && customers.data.length > 0) {
        customer = customers.data[0]
        console.log('Found existing customer:', customer.id)
      } else {
        console.log('No existing customer found, creating new one for:', user.email)
        customer = await dodoPaymentsAPI.createCustomer({
          email: user.email!,
          name: user.user_metadata?.full_name,
          metadata: {
            user_id: user.id,
            signup_date: new Date().toISOString()
          }
        })
        console.log('Customer created:', customer.id)
      }
    } catch (error) {
      console.error('Error with customer operations:', error)
      throw error
    }

    // Create checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`
    
    console.log('Creating checkout session for customer:', customer.id, 'with product:', dodoPaymentsConfig.productId)
    const session = await dodoPaymentsAPI.createCheckoutSession({
      productId: dodoPaymentsConfig.productId,
      customerEmail: user.email!,
      customerName: user.user_metadata?.full_name,
      successUrl,
      cancelUrl,
      metadata: {
        user_id: user.id,
        customer_id: customer.id
      }
    })
    
    console.log('Checkout session created:', session.id)

    // Update user profile with customer ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        dodo_customer_id: customer.id,
        subscription_status: 'pending'
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      // Don't fail the checkout for this, just log it
    }

    return NextResponse.json({
      checkout_url: session.checkout_url,
      session_id: session.id
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
