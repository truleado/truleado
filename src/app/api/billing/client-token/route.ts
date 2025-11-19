export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return client token for Paddle.js
    return NextResponse.json({
      clientToken: paddleConfig.clientToken,
      priceId: paddleConfig.priceId,
      environment: paddleConfig.environment
    })

  } catch (error) {
    console.error('Client token error:', error)
    return NextResponse.json({
      error: 'Failed to get client token'
    }, { status: 500 })
  }
}

