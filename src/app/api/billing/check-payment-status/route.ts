import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI } from '@/lib/paddle-config'
import { updateUserSubscription } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json()
    
    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Session ID and User ID are required' }, { status: 400 })
    }

    console.log('Checking payment status for session:', sessionId, 'user:', userId)
    
    // Get the checkout session from Paddle
    const session = await paddleAPI.getCheckoutSession(sessionId)

    const s: any = session?.data || session || {}
    const status: string = s?.status || s?.attributes?.status || s?.details?.status || ''
    const customerId: string | undefined = s?.customer_id || s?.attributes?.customer_id || s?.customer?.id

    console.log('Checkout session verification:', {
      rawStatus: status,
      acceptedStatuses: ['completed','paid','succeeded','processed','billed'],
      hasCustomerId: !!customerId,
      id: s?.id || sessionId
    })

    const isPaid = ['completed','paid','succeeded','processed','billed'].includes((status || '').toLowerCase())
    
    if (isPaid) {
      console.log('Payment completed, updating subscription for user:', userId)
      
      // Update subscription status
      await updateUserSubscription(userId, {
        subscription_status: 'active',
        paddle_customer_id: customerId,
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })

      console.log('Subscription updated successfully for user:', userId)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified and subscription updated',
        sessionStatus: status
      })
    } else {
      console.log('Payment not completed yet, status:', status)
      return NextResponse.json({ 
        success: false, 
        message: 'Payment not completed',
        sessionStatus: status
      })
    }
    
  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check payment status' 
    }, { status: 500 })
  }
}
