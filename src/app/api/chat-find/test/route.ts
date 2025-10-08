import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test basic database connectivity
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, subscription_status')
      .eq('id', user.id)
      .single()

    // Test if chat_find_searches table exists
    const { data: searches, error: searchesError } = await supabase
      .from('chat_find_searches')
      .select('id')
      .limit(1)

    // Test if usage tracking columns exist
    const { data: usageTest, error: usageError } = await supabase
      .from('profiles')
      .select('chat_find_free_searches_used, chat_find_searches_count')
      .eq('id', user.id)
      .single()

    // Test database functions
    let functionTest = null
    try {
      const { data: canSearch, error: canSearchError } = await supabase
        .rpc('can_perform_chat_find_search', { user_id: user.id })
      functionTest = { canSearch, canSearchError }
    } catch (error) {
      functionTest = { error: error.message }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      profile: {
        data: profile,
        error: profileError?.message
      },
      searchesTable: {
        exists: !searchesError,
        error: searchesError?.message
      },
      usageColumns: {
        exists: !usageError,
        error: usageError?.message,
        data: usageTest
      },
      functions: functionTest
    })

  } catch (error) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
