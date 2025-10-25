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
  public isInitialized: boolean = true

  constructor() {
    // No initialization needed for public API
    console.log('Reddit client initialized with public API only')
  }

  // Search for posts using Reddit's public API
  async searchPosts(options: RedditSearchOptions): Promise<RedditPost[]> {
    try {
      const { subreddit, query, sort = 'hot', limit = 25 } = options
      
      if (!subreddit) {
        console.log('No subreddit specified for search')
        return []
      }
      
      // Use Reddit's public search API
      let url: string
      if (query && query.trim()) {
        // Use Reddit's search API with query
        const searchQuery = encodeURIComponent(query)
        url = `https://www.reddit.com/r/${subreddit}/search.json?q=${searchQuery}&sort=${sort}&limit=${limit}&restrict_sr=1&t=week`
      } else {
        // Fallback to getting recent posts from subreddit
        url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`
      }
      
      console.log(`Fetching real Reddit data from: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      })

      if (!response.ok) {
        console.error(`Reddit API returned ${response.status} for r/${subreddit}`)
        if (response.status === 429) {
          console.log('Rate limited by Reddit, waiting before retry...')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
        return []
      }

      const data = await response.json()
      const posts = data.data?.children || []

      console.log(`Found ${posts.length} real posts from r/${subreddit}`)
      return posts.map((item: any) => this.formatPostFromPublicAPI(item.data))
    } catch (error) {
      console.error('Reddit public API search error:', error)
      return []
    }
  }

  // Get recent posts from a subreddit
  async getRecentPosts(subreddit: string, limit: number = 100): Promise<RedditPost[]> {
    return this.searchPosts({
      subreddit: subreddit,
      query: '',
      sort: 'hot',
      limit: limit
    })
  }

  // Format post data from Reddit's public API
  private formatPostFromPublicAPI(data: any): RedditPost {
    return {
      id: data.id,
      title: data.title || '',
      selftext: data.selftext || '',
      url: data.url || '',
      subreddit: data.subreddit || '',
      author: data.author || '',
      score: data.score || 0,
      num_comments: data.num_comments || 0,
      created_utc: data.created_utc || 0,
      permalink: `https://reddit.com${data.permalink || ''}`
    }
  }

  // Search for posts with multiple keywords
  async searchPostsWithKeywords(subreddit: string, keywords: string[], limit: number = 25): Promise<RedditPost[]> {
    const allPosts: RedditPost[] = []
    
    // Add a small delay between requests to avoid rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    for (const keyword of keywords.slice(0, 5)) { // Limit to 5 keywords to avoid rate limiting
      try {
        const posts = await this.searchPosts({
          subreddit: subreddit,
          query: keyword,
          sort: 'hot',
          limit: Math.ceil(limit / keywords.length)
        })
        allPosts.push(...posts)
        
        // Add delay between requests to avoid rate limiting
        await delay(1000)
      } catch (error) {
        console.error(`Error searching for keyword "${keyword}":`, error)
        // Add delay even on error to avoid rapid retries
        await delay(1000)
      }
    }
    
    // Remove duplicates based on post ID
    const uniquePosts = allPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    )
    
    return uniquePosts.slice(0, limit)
  }
}

// Global Reddit client instance
let redditClient: RedditClient | null = null

export function getRedditClient(): RedditClient {
  if (!redditClient) {
    redditClient = new RedditClient()
  }
  return redditClient
}