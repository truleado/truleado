export const dynamic = 'force-dynamic';
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

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Combine user data with profile data
    const userWithSubscription = { ...user, ...profile }

    // Check access for various features
    const accessChecks = {
      promote_products: canAccessFeature(userWithSubscription, 'promote_products'),
      add_products: canAccessFeature(userWithSubscription, 'add_products'),
      view_products: canAccessFeature(userWithSubscription, 'view_products'),
      view_leads: canAccessFeature(userWithSubscription, 'view_leads'),
      start_lead_discovery: canAccessFeature(userWithSubscription, 'start_lead_discovery')
    }

    // Get access level
    const accessLevel = getAccessLevel(userWithSubscription)
    const trialExpired = isTrialExpired(userWithSubscription)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscription_status: profile.subscription_status,
        trial_ends_at: profile.trial_ends_at,
        subscription_ends_at: profile.subscription_ends_at,
        trial_count: profile.trial_count,
        last_trial_at: profile.last_trial_at
      },
      access: {
        level: accessLevel,
        trialExpired,
        features: accessChecks
      },
      currentTime: new Date().toISOString(),
      trialEndsAt: profile.trial_ends_at ? new Date(profile.trial_ends_at).toISOString() : null
    })

  } catch (error) {
    console.error('User access debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
