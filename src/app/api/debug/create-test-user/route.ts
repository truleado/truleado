import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Create a test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@truleado.com',
      password: 'testpassword123',
      email_confirm: true
    })

    if (authError) {
      return NextResponse.json({ 
        error: 'Failed to create user',
        details: authError.message 
      }, { status: 400 })
    }

    // Create profile with PRO subscription
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'test@truleado.com',
        subscription_status: 'active',
        trial_ends_at: null,
        subscription_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        trial_count: 0,
        last_trial_at: null
      })

    if (profileError) {
      return NextResponse.json({ 
        error: 'Failed to create profile',
        details: profileError.message 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      message: 'Test user created successfully with PRO subscription'
    })

  } catch (error) {
    console.error('Create test user error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
