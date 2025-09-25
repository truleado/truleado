import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { updateUserSubscription } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionStatus = 'active' } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('Manually updating subscription for user:', userId)
    
    // Update subscription status
    await updateUserSubscription(userId, {
      subscription_status: subscriptionStatus,
      subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    })

    console.log('Subscription updated successfully for user:', userId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription updated successfully',
      userId,
      subscriptionStatus
    })
    
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update subscription' 
    }, { status: 500 })
  }
}
