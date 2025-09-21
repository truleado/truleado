import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Webhook test endpoint called')
    
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())
    
    console.log('Headers:', headers)
    console.log('Body:', body)
    
    return NextResponse.json({ 
      received: true,
      headers,
      body: body ? JSON.parse(body) : null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook test endpoint is working',
    timestamp: new Date().toISOString()
  })
}
