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
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get search history
    const { data: searches, error: searchesError } = await supabase
      .from('chat_find_searches')
      .select(`
        id,
        query,
        parsed_query,
        total_leads_found,
        search_status,
        error_message,
        created_at,
        completed_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (searchesError) {
      console.error('Error getting search history:', searchesError)
      return NextResponse.json({ error: 'Failed to get search history' }, { status: 500 })
    }

    // Get results for each search
    const searchesWithResults = await Promise.all(
      searches.map(async (search) => {
        const { data: results, error: resultsError } = await supabase
          .from('chat_find_results')
          .select(`
            id,
            title,
            subreddit,
            author,
            relevance_score,
            ai_analysis_score,
            created_at
          `)
          .eq('search_id', search.id)
          .order('relevance_score', { ascending: false })
          .limit(5) // Show top 5 results

        if (resultsError) {
          console.error('Error getting results for search:', search.id, resultsError)
        }

        return {
          ...search,
          topResults: results || []
        }
      })
    )

    return NextResponse.json({
      searches: searchesWithResults,
      total: searches.length,
      hasMore: searches.length === limit
    })

  } catch (error) {
    console.error('Error getting search history:', error)
    return NextResponse.json({ 
      error: 'Failed to get search history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
