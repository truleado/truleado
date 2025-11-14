export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing authentication...')
    
    const supabase = await createClient()
    
    // Test getting user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth test result:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    })
    
    if (authError) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        details: authError.message,
        code: authError.status
      })
    }
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'No user found',
        message: 'User not authenticated. Please sign in first.'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    })
    
  } catch (error) {
    console.error('❌ Auth test error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Auth test failed', 
      details: error.message 
    })
  }
}
