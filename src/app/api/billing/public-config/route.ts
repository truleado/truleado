import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      clientToken: paddleConfig.clientToken || '',
      priceId: paddleConfig.priceId || '',
      environment: paddleConfig.environment || 'sandbox'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load billing config' }, { status: 500 })
  }
}


