import { NextRequest, NextResponse } from 'next/server'

// Webhook debugging endpoint to see exactly what Paddle is sending
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())
    
    console.log('🔍 WEBHOOK DEBUG - Raw Request:')
    console.log('Headers:', JSON.stringify(headers, null, 2))
    console.log('Body:', body)
    console.log('Body Length:', body.length)
    console.log('Content-Type:', headers['content-type'])
    console.log('User-Agent:', headers['user-agent'])
    console.log('Paddle-Signature:', headers['paddle-signature'])
    
    // Try to parse JSON
    let parsedBody
    try {
      parsedBody = JSON.parse(body)
      console.log('✅ Parsed JSON:', JSON.stringify(parsedBody, null, 2))
    } catch (parseError) {
      console.log('❌ JSON Parse Error:', parseError)
      parsedBody = { raw: body }
    }
    
    // Check if this looks like a Paddle webhook
    const isPaddleWebhook = 
      headers['user-agent']?.includes('Paddle') ||
      headers['paddle-signature'] ||
      parsedBody.event_type ||
      parsedBody.event_id
    
    console.log('🔍 Is Paddle Webhook:', isPaddleWebhook)
    
    return NextResponse.json({
      success: true,
      message: 'Webhook debug data captured',
      timestamp: new Date().toISOString(),
      isPaddleWebhook,
      headers: headers,
      bodyLength: body.length,
      parsedBody: parsedBody,
      rawBody: body.substring(0, 500) + (body.length > 500 ? '...' : '')
    })
    
  } catch (error) {
    console.error('❌ Webhook debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook debug endpoint - use POST to test',
    methods: ['POST'],
    status: 'ready',
    timestamp: new Date().toISOString()
  })
}
