import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { canAccessFeature, getAccessLevel, isTrialExpired } from '@/lib/access-control'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with subscription data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    const userWithSubscription = { ...user, ...profile }
    
    // Check access control details
    const accessLevel = getAccessLevel(userWithSubscription)
    const trialExpired = isTrialExpired(userWithSubscription)
    const canAccessPromote = canAccessFeature(userWithSubscription, 'promote_products')
    
    return NextResponse.json({
      success: true,
      user: {
        id: userWithSubscription.id,
        email: userWithSubscription.email,
        subscription_status: userWithSubscription.subscription_status,
        trial_ends_at: userWithSubscription.trial_ends_at,
        subscription_ends_at: userWithSubscription.subscription_ends_at,
        trial_count: userWithSubscription.trial_count
      },
      access: {
        accessLevel,
        trialExpired,
        canAccessPromote,
        currentTime: new Date().toISOString(),
        trialEndsAt: userWithSubscription.trial_ends_at,
        timeUntilTrialEnds: userWithSubscription.trial_ends_at ? 
          new Date(userWithSubscription.trial_ends_at).getTime() - new Date().getTime() : null
      }
    })

  } catch (error) {
    console.error('Debug promote access error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
