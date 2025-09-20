import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { paddleConfig } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate Paddle checkout URL using the approved domain format
    const baseUrl = paddleConfig.environment === 'sandbox' 
      ? 'https://brewprompts.com/billing'
      : 'https://brewprompts.com/billing'
    
    const checkoutUrl = `${baseUrl}?` +
      `price_id=${paddleConfig.priceId}&` +
      `customer_email=${encodeURIComponent(user.email!)}&` +
      `customer_id=${encodeURIComponent(user.id)}&` +
      `return_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/billing/success`)}&` +
      `cancel_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`)}`
    
    return NextResponse.json({
      checkout_url: checkoutUrl
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create checkout session'
    }, { status: 500 })
  }
}
