import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Try to create Supabase client
    const supabase = await createClient()
    
    // Check if it's the mock client
    const isMockClient = !supabase.auth || typeof supabase.auth.getUser !== 'function'
    
    return NextResponse.json({
      success: true,
      message: 'Supabase client test',
      env: {
        hasSupabaseUrl,
        hasSupabaseAnonKey,
        supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        supabaseAnonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      },
      client: {
        isMockClient,
        hasAuth: !!supabase.auth,
        hasGetUser: typeof supabase.auth?.getUser === 'function',
        clientType: isMockClient ? 'mock' : 'real'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to test Supabase client',
      details: error instanceof Error ? error.message : 'Unknown error',
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    }, { status: 500 })
  }
}
