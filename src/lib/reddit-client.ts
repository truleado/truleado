import snoowrap from 'snoowrap'

export interface RedditPost {
  id: string
  title: string
  selftext: string
  url: string
  subreddit: string
  author: string
  score: number
  num_comments: number
  created_utc: number
  permalink: string
}

export interface RedditSearchOptions {
  subreddit?: string
  query: string
  sort?: 'relevance' | 'hot' | 'top' | 'new'
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
  limit?: number
}

export class RedditClient {
  private client: snoowrap | null = null
  public isInitialized: boolean = false
  public userId: string | null = null

  constructor(userId?: string) {
    this.userId = userId || null
    this.initialize()
  }

  private async initialize() {
    try {
      // If we have a userId, try to get OAuth tokens from database
      if (this.userId) {
        await this.initializeWithOAuth()
        return
      }

      // Fallback to environment variables for backward compatibility
      const clientId = process.env.REDDIT_CLIENT_ID
      const clientSecret = process.env.REDDIT_CLIENT_SECRET
      const userAgent = process.env.REDDIT_USER_AGENT || 'Truleado Lead Discovery Bot 1.0'
      const username = process.env.REDDIT_USERNAME
      const password = process.env.REDDIT_PASSWORD

      if (!clientId || !clientSecret) {
        console.warn('Reddit API credentials not found. Reddit search will be disabled.')
        return
      }

      // For script-type Reddit apps, we need username and password
      if (username && password) {
        this.client = new snoowrap({
          userAgent: userAgent,
          clientId: clientId,
          clientSecret: clientSecret,
          username: username,
          password: password
        })
        console.log('Reddit client initialized with username/password authentication')
      } else if (process.env.REDDIT_REFRESH_TOKEN) {
        // Alternative: use refresh token if available
        this.client = new snoowrap({
          userAgent: userAgent,
          clientId: clientId,
          clientSecret: clientSecret,
          refreshToken: process.env.REDDIT_REFRESH_TOKEN
        })
        console.log('Reddit client initialized with refresh token authentication')
      } else {
        console.warn('Reddit username/password or refresh token not found. Reddit search will be disabled.')
        return
      }

      this.isInitialized = true
      console.log('Reddit client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Reddit client:', error)
    }
  }

  private async initializeWithOAuth() {
    try {
      if (!this.userId) {
        console.log('No userId provided for OAuth initialization')
        return
      }

      console.log(`Initializing Reddit OAuth for user: ${this.userId}`)

      // Get user's Reddit tokens from database
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('reddit_access_token, reddit_refresh_token, reddit_token_expires_at, reddit_username')
        .eq('user_id', this.userId)
        .single()

      if (error) {
        console.error('Error fetching Reddit tokens:', error)
        return
      }

      console.log('API Keys query result:', { apiKeys, error })

      if (!apiKeys || !apiKeys.reddit_access_token) {
        console.warn('No Reddit OAuth tokens found for user. Reddit search will be disabled.')
        return
      }

      console.log(`Found Reddit tokens for user: ${apiKeys.reddit_username}`)

      // Check if token is expired and try to refresh if needed
      const isTokenExpired = apiKeys.reddit_token_expires_at && 
        new Date(apiKeys.reddit_token_expires_at) <= new Date()

      if (isTokenExpired) {
        console.log('Reddit OAuth token expired. Attempting to refresh...')
        const refreshResult = await this.refreshRedditToken(apiKeys.reddit_refresh_token)
        if (!refreshResult.success) {
          console.warn('Failed to refresh Reddit token. Reddit search will be disabled.')
          console.warn('Refresh error:', refreshResult.error)
          return
        }
        // Update apiKeys with new token data
        Object.assign(apiKeys, refreshResult.tokens)
        console.log('Reddit token refreshed successfully')
      }

      const userAgent = 'Truleado Lead Discovery Bot 1.0'
      const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
      const clientSecret = process.env.REDDIT_OAUTH_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.warn('Reddit OAuth client credentials not found. Reddit search will be disabled.')
        return
      }

      console.log('Creating snoowrap client with OAuth tokens')
      this.client = new snoowrap({
        userAgent: userAgent,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: apiKeys.reddit_refresh_token
      })

      this.isInitialized = true
      console.log('Reddit client initialized with OAuth tokens successfully')
    } catch (error) {
      console.error('Failed to initialize Reddit client with OAuth:', error)
    }
  }

  // Refresh Reddit OAuth token
  private async refreshRedditToken(refreshToken: string): Promise<{ success: boolean; tokens?: any; error?: string }> {
    try {
      const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
      const clientSecret = process.env.REDDIT_OAUTH_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        return { success: false, error: 'Reddit OAuth credentials not found' }
      }

      console.log('Refreshing Reddit OAuth token...')

      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'User-Agent': 'Truleado Lead Discovery Bot 1.0'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Reddit token refresh failed:', response.status, errorText)
        return { success: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const data = await response.json()

      if (data.error) {
        console.error('Reddit API error during token refresh:', data.error)
        return { success: false, error: data.error }
      }

      console.log('Reddit token refreshed successfully')

      // Update tokens in database
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const newTokens = {
        reddit_access_token: data.access_token,
        reddit_token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('api_keys')
        .update(newTokens)
        .eq('user_id', this.userId)

      console.log('Token refresh database update result:', { updateError, userId: this.userId })

      if (updateError) {
        console.error('Failed to update refreshed tokens in database:', updateError)
        return { success: false, error: 'Failed to save refreshed tokens' }
      }

      return { success: true, tokens: newTokens }
    } catch (error) {
      console.error('Error refreshing Reddit token:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Check and refresh token if needed before making API calls
  private async ensureValidToken(): Promise<boolean> {
    try {
      if (!this.userId) return false

      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('reddit_access_token, reddit_refresh_token, reddit_token_expires_at')
        .eq('user_id', this.userId)
        .single()

      if (error || !apiKeys || !apiKeys.reddit_access_token) {
        return false
      }

      // Check if token expires in the next 5 minutes (proactive refresh)
      const expiresAt = new Date(apiKeys.reddit_token_expires_at)
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)

      if (expiresAt <= fiveMinutesFromNow) {
        console.log('Reddit token expires soon. Refreshing proactively...')
        const refreshResult = await this.refreshRedditToken(apiKeys.reddit_refresh_token)
        return refreshResult.success
      }

      return true
    } catch (error) {
      console.error('Error checking token validity:', error)
      return false
    }
  }

  // Search for posts in specific subreddits
  async searchPosts(options: RedditSearchOptions): Promise<RedditPost[]> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Reddit account not connected. Please connect your Reddit account to search for leads.')
    }

    // Ensure token is valid before making API calls
    const tokenValid = await this.ensureValidToken()
    if (!tokenValid) {
      throw new Error('Reddit token is invalid or expired. Please reconnect your Reddit account.')
    }

    try {
      const { subreddit, query, sort = 'relevance', time = 'year', limit = 100 } = options

      let searchResults: any[]

      if (subreddit) {
        // Search within specific subreddit
        const subredditInstance = this.client.getSubreddit(subreddit)
        searchResults = await subredditInstance.search({
          query: query,
          sort: sort,
          time: time,
        })
      } else {
        // Search across all subreddits
        searchResults = await this.client.search({
          query: query,
          subreddit: subreddit,
          sort: sort,
          time: time,
        })
      }

      return searchResults.map(post => this.formatPost(post))
    } catch (error) {
      console.error('Reddit search error:', error)
      throw new Error('Failed to search Reddit. Please check your Reddit connection.')
    }
  }

  // Fallback method using Reddit's public API
  private async searchPostsPublic(options: RedditSearchOptions): Promise<RedditPost[]> {
    try {
      const { subreddit, query, sort = 'hot', limit = 25 } = options
      
      // Use Reddit's public API - get recent posts from subreddit
      const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`
      
      console.log(`Fetching real Reddit data from: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Truleado Lead Discovery Bot 1.0'
        }
      })

      if (!response.ok) {
        console.error(`Reddit API returned ${response.status} for r/${subreddit}`)
        // Return empty array instead of mock data
        return []
      }

      const data = await response.json()
      const posts = data.data?.children || []

      console.log(`Found ${posts.length} real posts from r/${subreddit}`)
      return posts.map((item: any) => this.formatPostFromPublicAPI(item.data))
    } catch (error) {
      console.error('Reddit public API search error:', error)
      // Return empty array instead of mock data
      return []
    }
  }

  // Get recent posts from a subreddit
  async getRecentPosts(subreddit: string, limit: number = 100): Promise<RedditPost[]> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Reddit account not connected. Please connect your Reddit account to search for leads.')
    }

    // Ensure token is valid before making API calls
    const tokenValid = await this.ensureValidToken()
    if (!tokenValid) {
      throw new Error('Reddit token is invalid or expired. Please reconnect your Reddit account.')
    }

    try {
      const subredditInstance = this.client.getSubreddit(subreddit)
      const posts = await subredditInstance.getHot({ limit })

      return posts.map(post => this.formatPost(post))
    } catch (error) {
      console.error('Reddit getRecentPosts error:', error)
      throw new Error('Failed to fetch Reddit posts. Please check your Reddit connection.')
    }
  }

  // Get recent posts using public API
  private async getRecentPostsPublic(subreddit: string, limit: number = 50): Promise<RedditPost[]> {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`
      
      console.log(`Fetching recent posts from: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Truleado Lead Discovery Bot 1.0'
        }
      })

      if (!response.ok) {
        console.error(`Reddit API returned ${response.status} for r/${subreddit}`)
        return []
      }

      const data = await response.json()
      const posts = data.data?.children || []

      console.log(`Found ${posts.length} recent posts from r/${subreddit}`)
      return posts.map((item: any) => this.formatPostFromPublicAPI(item.data))
    } catch (error) {
      console.error('Reddit recent posts API error:', error)
      return []
    }
  }

  // Get comments from a post
  async getPostComments(postId: string): Promise<any[]> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Reddit account not connected. Please connect your Reddit account to search for leads.')
    }

    // Ensure token is valid before making API calls
    const tokenValid = await this.ensureValidToken()
    if (!tokenValid) {
      throw new Error('Reddit token is invalid or expired. Please reconnect your Reddit account.')
    }

    try {
      const submission = this.client.getSubmission(postId)
      const comments = await submission.comments

      return comments.map(comment => ({
        id: comment.id,
        body: comment.body,
        author: comment.author.name,
        score: comment.score,
        created_utc: comment.created_utc
      }))
    } catch (error) {
      console.error('Reddit getPostComments error:', error)
      throw new Error('Failed to fetch Reddit comments. Please check your Reddit connection.')
    }
  }

  // Get comments using public API
  private async getPostCommentsPublic(postId: string): Promise<any[]> {
    try {
      const url = `https://www.reddit.com/comments/${postId}.json`
      
      console.log(`Fetching comments from: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Truleado Lead Discovery Bot 1.0'
        }
      })

      if (!response.ok) {
        console.error(`Reddit API returned ${response.status} for post ${postId}`)
        return []
      }

      const data = await response.json()
      const comments = data[1]?.data?.children || []

      console.log(`Found ${comments.length} comments for post ${postId}`)
      return comments.map((item: any) => ({
        id: item.data.id,
        body: item.data.body,
        author: item.data.author,
        score: item.data.score,
        created_utc: item.data.created_utc
      }))
    } catch (error) {
      console.error('Reddit comments API error:', error)
      return []
    }
  }

  // Format Reddit post data
  private formatPost(post: any): RedditPost {
    return {
      id: post.id,
      title: post.title,
      selftext: post.selftext || '',
      url: `https://reddit.com${post.permalink}`,
      subreddit: post.subreddit.display_name,
      author: post.author.name,
      score: post.score,
      num_comments: post.num_comments,
      created_utc: post.created_utc,
      permalink: post.permalink
    }
  }

  // Format Reddit post data from public API
  private formatPostFromPublicAPI(post: any): RedditPost {
    return {
      id: post.id,
      title: post.title,
      selftext: post.selftext || '',
      url: post.url || `https://reddit.com${post.permalink}`,
      subreddit: post.subreddit,
      author: post.author,
      score: post.score,
      num_comments: post.num_comments,
      created_utc: post.created_utc,
      permalink: post.permalink
    }
  }

  // Generate search terms from product data
  generateSearchTerms(product: any): string[] {
    const terms: string[] = []

    // Add product name
    if (product.name) {
      terms.push(product.name)
    }

    // Add features
    if (product.features && Array.isArray(product.features)) {
      terms.push(...product.features)
    }

    // Add benefits
    if (product.benefits && Array.isArray(product.benefits)) {
      terms.push(...product.benefits)
    }

    // Add pain points
    if (product.pain_points && Array.isArray(product.pain_points)) {
      terms.push(...product.pain_points)
    }

    // Add generic solution terms
    terms.push(
      'solution',
      'tool',
      'software',
      'app',
      'service',
      'looking for',
      'need',
      'want',
      'recommend',
      'suggest',
      'help with',
      'struggling with',
      'problem with'
    )

    // Remove duplicates and filter out empty terms
    return [...new Set(terms.filter(term => term && term.trim().length > 0))]
  }

  // Mock data for when Reddit API is not available
  private getMockPosts(): RedditPost[] {
    return [
      {
        id: 'mock1',
        title: 'Looking for a project management tool for my startup',
        selftext: 'We are a small startup team of 5 people and need a good project management solution. Any recommendations?',
        url: 'https://reddit.com/r/startups/comments/mock1',
        subreddit: 'startups',
        author: 'startup_founder',
        score: 15,
        num_comments: 8,
        created_utc: Date.now() / 1000 - 86400, // 1 day ago
        permalink: '/r/startups/comments/mock1'
      },
      {
        id: 'mock2',
        title: 'Best CRM software for small business?',
        selftext: 'I run a small consulting business and need to track my clients better. What CRM would you recommend?',
        url: 'https://reddit.com/r/smallbusiness/comments/mock2',
        subreddit: 'smallbusiness',
        author: 'consultant_123',
        score: 23,
        num_comments: 12,
        created_utc: Date.now() / 1000 - 172800, // 2 days ago
        permalink: '/r/smallbusiness/comments/mock2'
      }
    ]
  }

  private getMockComments(): any[] {
    return [
      {
        id: 'comment1',
        body: 'I would recommend checking out some project management tools. What\'s your budget?',
        author: 'helpful_user',
        score: 5,
        created_utc: Date.now() / 1000 - 3600
      }
    ]
  }
}

// Global Reddit client instance
let redditClient: RedditClient | null = null

export function getRedditClient(userId?: string): RedditClient {
  if (!redditClient || (userId && redditClient.userId !== userId)) {
    redditClient = new RedditClient(userId)
  }
  return redditClient
}
