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

    // Get search results
    const { data: results, error: resultsError } = await supabase
      .from('chat_find_results')
      .select('*')
      .eq('search_id', searchId)
      .order('relevance_score', { ascending: false })

    console.log('Results API - Search ID:', searchId)
    console.log('Results API - Results count:', results?.length || 0)
    console.log('Results API - Results error:', resultsError)

    if (resultsError) {
      console.error('Error getting search results:', resultsError)
      return NextResponse.json({ error: 'Failed to get search results' }, { status: 500 })
    }

    // Format results for frontend
    const formattedResults = results.map(result => ({
      id: result.lead_id,
      title: result.title,
      content: result.content,
      subreddit: result.subreddit,
      author: result.author,
      url: result.url,
      score: result.score,
      comments: result.comments,
      createdAt: result.created_at,
      relevanceScore: result.relevance_score / 100, // Convert back from integer to decimal
      aiAnalysisReasons: result.ai_analysis_reasons || [],
      aiSampleReply: result.ai_sample_reply || '',
      aiAnalysisScore: result.ai_analysis_score || 0,
      leadType: result.lead_type,
      parentPostTitle: result.parent_post_title,
      parentPostUrl: result.parent_post_url,
      isComment: result.is_comment
    }))

    return NextResponse.json({
      results: formattedResults,
      total: formattedResults.length
    })

  } catch (error) {
    console.error('Error getting search results:', error)
    return NextResponse.json({ 
      error: 'Failed to get search results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
