export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user profile with subscription data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        subscription_status,
        trial_ends_at,
        subscription_ends_at,
        trial_count,
        last_trial_at,
        created_at,
        updated_at
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        subscription_status: profile.subscription_status || 'trial',
        trial_ends_at: profile.trial_ends_at,
        subscription_ends_at: profile.subscription_ends_at,
        trial_count: profile.trial_count || 0,
        last_trial_at: profile.last_trial_at,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    })
  } catch (error) {
    console.error('Error in /api/auth/user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
