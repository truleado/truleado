import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionStatus } = await request.json()
    
    if (!userId || !subscriptionStatus) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId and subscriptionStatus' 
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Update user subscription status
    const { error } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating subscription:', error)
      return NextResponse.json({ 
        error: 'Failed to update subscription status' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription updated successfully' 
    })
  } catch (error) {
    console.error('Error in manual subscription update:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
