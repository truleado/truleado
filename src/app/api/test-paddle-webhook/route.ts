import { NextRequest, NextResponse } from 'next/server'

// Comprehensive webhook testing endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🧪 Testing webhook with data:', JSON.stringify(body, null, 2))

    // Test different webhook structures
    const testCases = [
      {
        name: 'checkout.session.completed with customer_email',
        payload: {
          event_type: 'checkout.session.completed',
          event_id: 'evt_test_123',
          occurred_at: new Date().toISOString(),
          data: {
            id: 'cs_test_123',
            customer_id: 'ctm_test_123',
            customer_email: 'test@example.com',
            customer_name: 'Test User',
            status: 'completed',
            amount: { total: '2900', currency: 'USD' }
          }
        }
      },
      {
        name: 'subscription.created with customer object',
        payload: {
          event_type: 'subscription.created',
          event_id: 'evt_test_456',
          occurred_at: new Date().toISOString(),
          data: {
            id: 'sub_test_123',
            customer_id: 'ctm_test_456',
            customer: {
              id: 'ctm_test_456',
              email: 'test2@example.com',
              name: 'Test Customer'
            },
            status: 'active'
          }
        }
      },
      {
        name: 'transaction.completed with billing_address',
        payload: {
          event_type: 'transaction.completed',
          event_id: 'evt_test_789',
          occurred_at: new Date().toISOString(),
          data: {
            id: 'txn_test_123',
            customer_id: 'ctm_test_789',
            billing_address: {
              email: 'test3@example.com',
              name: 'Test Billing'
            },
            amount: { total: '2900', currency: 'USD' }
          }
        }
      }
    ]

    const results = []

    for (const testCase of testCases) {
      try {
        console.log(`🧪 Testing: ${testCase.name}`)
        
        // Call the production webhook endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.truleado.com'}/api/paddle-webhook-production`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Paddle-Signature': 'test-signature'
          },
          body: JSON.stringify(testCase.payload)
        })

        const result = await response.json()
        
        results.push({
          testCase: testCase.name,
          status: response.status,
          success: response.ok,
          result: result
        })
        
        console.log(`✅ ${testCase.name}:`, response.status, result)
      } catch (error) {
        results.push({
          testCase: testCase.name,
          status: 'error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.error(`❌ ${testCase.name}:`, error)
      }
    }

    return NextResponse.json({
      message: 'Webhook testing completed',
      timestamp: new Date().toISOString(),
      results: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('❌ Webhook testing error:', error)
    return NextResponse.json({
      success: false,
      error: 'Webhook testing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Paddle webhook testing endpoint',
    methods: ['POST'],
    status: 'ready',
    timestamp: new Date().toISOString()
  })
}
