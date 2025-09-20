import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getPaddleCheckoutUrl } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate Paddle checkout URL using the consolidated function
    const checkoutUrl = getPaddleCheckoutUrl(user.id, user.email!)
    
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
