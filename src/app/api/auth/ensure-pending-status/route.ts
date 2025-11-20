export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// This API route ensures new users have 'pending' status
// Called after signup to fix cases where webhook doesn't fire
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, created_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // If user was just created (within last 5 minutes) and has 'trial' status,
    // change it to 'pending' to require checkout
    const profileCreatedAt = new Date(profile.created_at)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    if (profileCreatedAt > fiveMinutesAgo && profile.subscription_status === 'trial') {
      const fallbackTrialEndsAt = new Date()
      fallbackTrialEndsAt.setDate(fallbackTrialEndsAt.getDate() + 7)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'pending',
          trial_ends_at: fallbackTrialEndsAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating status to pending:', updateError)
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
      }

      console.log('✅ Updated user status to pending:', user.id)
      return NextResponse.json({ 
        success: true, 
        message: 'Status updated to pending',
        subscription_status: 'pending'
      })
    }

    // If already pending or other status, just return current status
    return NextResponse.json({ 
      success: true, 
      subscription_status: profile.subscription_status 
    })
  } catch (error) {
    console.error('Error ensuring pending status:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

