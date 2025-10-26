import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Helper function to get Reddit access token
async function getRedditAccessToken(userId?: string): Promise<string | null> {
  try {
    // Try to get user's Reddit token first
    if (userId) {
      const supabase = await createClient()
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('reddit_access_token, reddit_token_expires_at')
        .eq('user_id', userId)
        .single()

      if (apiKeys?.reddit_access_token) {
        const isExpired = apiKeys.reddit_token_expires_at && 
          new Date(apiKeys.reddit_token_expires_at) <= new Date()

        if (!isExpired) {
          console.log('Using user Reddit token')
          return apiKeys.reddit_access_token
        }
      }
    }

    // Fall back to server token
    console.log('Falling back to server Reddit token')
    const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
    const clientSecret = process.env.REDDIT_OAUTH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Reddit OAuth credentials not configured')
      return null
    }

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'User-Agent': 'Truleado/1.0'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'read'
      })
    })

    if (!response.ok) {
      console.error('Failed to get Reddit access token:', response.status)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting Reddit access token:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, limit = 10 } = await request.json()

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    // Get user ID
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get Reddit access token
    const accessToken = await getRedditAccessToken(user?.id)

    // Search Reddit
    const searchUrl = `https://oauth.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=hot&limit=${limit}&t=all`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    }
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const redditResponse = await fetch(searchUrl, {
      headers,
      cache: 'no-store',
      signal: controller.signal,
      redirect: 'follow',
    }).finally(() => clearTimeout(timeoutId))

    if (!redditResponse.ok) {
      throw new Error(`Reddit API error: ${redditResponse.status}`)
    }

    const redditData = await redditResponse.json()
    const posts = redditData.data?.children || []

    // Format posts
    const formattedPosts = posts.map((child: any) => {
      const post = child.data
      return {
        title: post.title,
        selftext: post.selftext,
        subreddit: post.subreddit,
        score: post.score,
        num_comments: post.num_comments,
        url: `https://reddit.com${post.permalink}`,
        created_utc: post.created_utc,
        author: post.author,
        subreddit_name_prefixed: post.subreddit_name_prefixed,
      }
    })

    return NextResponse.json({ 
      success: true,
      posts: formattedPosts,
      keyword 
    })

  } catch (error: any) {
    console.error('Error searching Reddit:', error)
    return NextResponse.json({ 
      error: 'Failed to search Reddit', 
      details: error.message 
    }, { status: 500 })
  }
}

