import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('IMMEDIATELY activating subscription for user:', userId)
    
    const supabase = createClient()
    
    // Immediately update subscription status to active
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating subscription:', error)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    console.log('Subscription IMMEDIATELY activated for user:', userId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription IMMEDIATELY activated',
      userId
    })
    
  } catch (error) {
    console.error('Error activating subscription:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to activate subscription' 
    }, { status: 500 })
  }
}
