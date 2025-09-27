import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Test webhook received:', JSON.stringify(body, null, 2))
    
    // Simulate a checkout.session.completed event
    const testEvent = {
      event_type: 'checkout.session.completed',
      event_id: 'test_' + Date.now(),
      data: {
        id: 'test_session_' + Date.now(),
        customer_email: 'truleado@gmail.com',
        custom_data: {
          user_id: 'test_user_id'
        },
        customer_id: 'test_customer_' + Date.now(),
        next_billed_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        details: {
          totals: {
            total: '2900'
          }
        }
      }
    }

    console.log('Sending test event to billing webhook...')
    
    // Forward to the actual billing webhook
    const webhookResponse = await fetch(`${request.nextUrl.origin}/api/billing/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent)
    })

    const webhookResult = await webhookResponse.text()
    console.log('Billing webhook response:', webhookResponse.status, webhookResult)

    return NextResponse.json({
      success: true,
      message: 'Test webhook sent',
      webhookStatus: webhookResponse.status,
      webhookResponse: webhookResult
    })
  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
