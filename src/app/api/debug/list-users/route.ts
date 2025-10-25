import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, subscription_status, trial_ends_at, subscription_ends_at, trial_count, last_trial_at')
      .limit(10)

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch profiles',
        details: error.message 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      profiles: profiles || [],
      count: profiles?.length || 0
    })

  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
