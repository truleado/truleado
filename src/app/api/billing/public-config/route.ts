import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    // Return public Paddle configuration needed for client-side checkout
    return NextResponse.json({
      clientToken: paddleConfig.clientToken,
      priceId: paddleConfig.priceId,
      environment: paddleConfig.environment
    })
  } catch (error) {
    console.error('Error fetching public config:', error)
    return NextResponse.json({ 
      error: 'Failed to load billing configuration' 
    }, { status: 500 })
  }
}
