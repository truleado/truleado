export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Simulate a paid user with active subscription
    const paidUser = {
      id: 'paid-user-id',
      email: 'paid@truleado.com',
      subscription_status: 'active',
      trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago (expired trial)
      subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      trial_count: 1,
      last_trial_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    }

    return NextResponse.json({
      success: true,
      user: paidUser,
      message: 'Paid user simulation created'
    })
  } catch (error) {
    console.error('Failed to create paid user simulation:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create paid user simulation'
    }, { status: 500 })
  }
}
