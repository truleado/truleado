import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: error?.message 
      }, { status: 401 })
    }
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
