export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { TrialManager } from '@/lib/trial-manager'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check trial eligibility
    const trialManager = new TrialManager()
    const eligibility = await trialManager.checkTrialEligibility(
      user.email || '',
      ipAddress,
      userAgent
    )

    if (!eligibility.allowed) {
      return NextResponse.json({ 
        error: 'Trial not available',
        reason: eligibility.reason || 'Trial limit reached'
      }, { status: 403 })
    }

    // Start 7-day trial
    const success = await trialManager.startTrial(
      user.id,
      user.email || '',
      ipAddress,
      userAgent
    )

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to start trial',
        message: 'Please try again or contact support.'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: '7-day free trial started successfully',
      trialDays: 7
    })
  } catch (error: any) {
    console.error('Error starting trial:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
