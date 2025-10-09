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

    const { searchParams } = new URL(request.url)
    const searchId = searchParams.get('searchId')

    if (!searchId) {
      return NextResponse.json({ error: 'Search ID is required' }, { status: 400 })
    }

    // Get search progress
    const { data: search, error: searchError } = await supabase
      .from('chat_find_searches')
      .select('*')
      .eq('id', searchId)
      .eq('user_id', user.id)
      .single()

    console.log('Progress API - Search record:', search)
    console.log('Progress API - Search error:', searchError)

    if (searchError || !search) {
      console.log('Progress API - Search not found or error')
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Get current results count
    const { count: resultsCount, error: countError } = await supabase
      .from('chat_find_results')
      .select('*', { count: 'exact', head: true })
      .eq('search_id', searchId)

    if (countError) {
      console.error('Error getting results count:', countError)
    }

    // Calculate progress based on search status
    let progress = 0
    let status = search.search_status
    let message = ''

    switch (search.search_status) {
      case 'pending':
        progress = 10
        message = 'Initializing search...'
        break
      case 'processing':
        // Estimate progress based on parsed query subreddits
        const subreddits = search.parsed_query?.subreddits || []
        const estimatedTotal = subreddits.length * 3 // 3 leads per subreddit
        progress = Math.min(90, 20 + (resultsCount || 0) * 70 / estimatedTotal)
        message = `Searching ${subreddits.length} subreddits... Found ${resultsCount || 0} leads so far`
        break
      case 'completed':
        progress = 100
        message = `Search completed! Found ${search.total_leads_found} leads`
        break
      case 'failed':
        progress = 0
        message = search.error_message || 'Search failed'
        break
    }

    return NextResponse.json({
      searchId: search.id,
      status,
      progress: Math.round(progress),
      message,
      totalLeads: search.total_leads_found || 0,
      currentLeads: resultsCount || 0,
      query: search.query,
      createdAt: search.created_at,
      completedAt: search.completed_at
    })

  } catch (error) {
    console.error('Error getting search progress:', error)
    return NextResponse.json({ 
      error: 'Failed to get search progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
