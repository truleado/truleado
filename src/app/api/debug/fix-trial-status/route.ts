import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate trial end date (1 day from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    // Set up trial for the current user
    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'trial',
        trial_ends_at: trialEndDate.toISOString(),
        trial_count: 1,
        last_trial_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()

    if (error) {
      console.error('Error setting up trial for user:', error)
      return NextResponse.json({ error: 'Failed to set up trial' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Trial status updated successfully',
      trialEndsAt: trialEndDate.toISOString(),
      user: data?.[0]
    })

  } catch (error) {
    console.error('Fix trial status error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
