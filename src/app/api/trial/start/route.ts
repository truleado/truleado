import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { TrialManager } from '@/lib/trial-manager'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a trial or subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, trial_count')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to check user status' }, { status: 500 })
    }

    // If user already has an active trial or subscription, return current status
    if (profile?.subscription_status === 'trial' || profile?.subscription_status === 'active') {
      return NextResponse.json({ 
        message: 'User already has active access',
        subscription_status: profile.subscription_status,
        trial_ends_at: profile.trial_ends_at
      })
    }

    // Get client IP and user agent for abuse prevention
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Check trial eligibility
    const trialManager = new TrialManager()
    const eligibilityCheck = await trialManager.checkTrialEligibility(
      user.email || '', 
      clientIP, 
      userAgent
    )

    if (!eligibilityCheck.allowed) {
      return NextResponse.json({ 
        error: 'Trial not available',
        reason: eligibilityCheck.reason,
        blockUntil: eligibilityCheck.blockUntil
      }, { status: 403 })
    }

    // Start the trial
    const trialStarted = await trialManager.startTrial(
      user.id, 
      user.email || '', 
      clientIP, 
      userAgent
    )

    if (!trialStarted) {
      return NextResponse.json({ 
        error: 'Failed to start trial' 
      }, { status: 500 })
    }

    // Return success with trial details
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7 days from now

    return NextResponse.json({
      success: true,
      message: '7-day trial started successfully',
      trial_ends_at: trialEndsAt.toISOString(),
      subscription_status: 'trial'
    })

  } catch (error) {
    console.error('Trial start error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
