import { createClient } from '@/lib/supabase-server'
import { getRedditClient } from '@/lib/reddit-client'
import { aiLeadAnalyzer, LeadData, ProductData } from '@/lib/ai-lead-analyzer'

export interface BackgroundJob {
  id: string
  user_id: string
  product_id: string
  job_type: string
  status: 'active' | 'paused' | 'stopped' | 'error'
  interval_minutes: number
  last_run: string | null
  next_run: string | null
  error_message: string | null
  run_count: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  website_url: string
  features: string[]
  benefits: string[]
  pain_points: string[]
  ideal_customer_profile: string
  subreddits: string[]
  status: string
}

export class JobScheduler {
  private supabase: any
  public isRunning: boolean = false
  private intervalId: NodeJS.Timeout | null = null

  constructor() {
    this.supabase = null
  }

  async initialize() {
    // Use direct Supabase client for background jobs (no cookies needed)
    const { createClient } = await import('@supabase/supabase-js')
    
    // Use service role key if available, otherwise use anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseKey || !supabaseUrl) {
      console.error('Missing Supabase credentials:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        url: supabaseUrl,
        keyPrefix: supabaseKey?.substring(0, 10) + '...'
      })
      throw new Error('No Supabase credentials found')
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('Job scheduler initialized with Supabase client')
    
    // Test the connection
    try {
      const { data, error } = await this.supabase
        .from('background_jobs')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('Supabase connection test failed:', error)
        throw new Error(`Supabase connection failed: ${error.message}`)
      }
      
      console.log('Supabase connection test successful')
    } catch (testError) {
      console.error('Supabase connection test error:', testError)
      throw testError
    }
  }

  // Start the job scheduler
  async start() {
    if (this.isRunning) {
      console.log('Job scheduler is already running')
      return
    }

    console.log('Starting job scheduler...')
    this.isRunning = true

    // Run immediately on start
    await this.processJobs()

    // Then run every minute
    this.intervalId = setInterval(async () => {
      await this.processJobs()
    }, 60000) // 60 seconds
  }

  // Stop the job scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Job scheduler stopped')
  }

  // Process all active jobs
  public async processJobs() {
    try {
      if (!this.supabase) {
        await this.initialize()
      }

      // Get all active jobs that are due to run
      const now = new Date().toISOString()
      console.log(`Looking for jobs with next_run <= ${now}`)
      
      // First, let's see all jobs regardless of next_run
      const { data: allJobs, error: allJobsError } = await this.supabase
        .from('background_jobs')
        .select('*')
        .eq('status', 'active')
      
      if (allJobsError) {
        console.error('Error fetching all active jobs:', allJobsError)
        return
      }
      
      console.log(`Found ${allJobs?.length || 0} active jobs in database`)
      
      if (allJobs && allJobs.length > 0) {
        allJobs.forEach((job: any) => {
          console.log(`Job ${job.id}: next_run=${job.next_run}, now=${now}, isDue=${job.next_run <= now}`)
        })
      }
      
      const { data: jobs, error } = await this.supabase
        .from('background_jobs')
        .select('*')
        .eq('status', 'active')
        .lte('next_run', now)

      if (error) {
        console.error('Error fetching jobs:', error)
        return
      }

      if (!jobs || jobs.length === 0) {
        console.log('No jobs to process')
        
        // Debug: Let's see all jobs
        const { data: allJobs, error: allJobsError } = await this.supabase
          .from('background_jobs')
          .select('*')
        
        if (allJobsError) {
          console.error('Error fetching all jobs:', allJobsError)
        } else if (allJobs && allJobs.length > 0) {
          console.log('All jobs in database:', allJobs.map((job: any) => ({
            id: job.id,
            status: job.status,
            next_run: job.next_run,
            product_id: job.product_id,
            user_id: job.user_id
          })))
        } else {
          console.log('No jobs found in database at all')
        }
        return
      }

      console.log(`Processing ${jobs.length} jobs...`)

      // Process each job
      for (const job of jobs) {
        await this.executeJob(job)
      }
    } catch (error) {
      console.error('Error processing jobs:', error)
    }
  }

  // Execute a specific job
  private async executeJob(job: BackgroundJob) {
    try {
      console.log(`Executing job ${job.id} for product ${job.product_id}`)

      // Update job status to running
      await this.updateJobStatus(job.id, 'active', null, new Date().toISOString())

      // Get product details
      const { data: product, error: productError } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', job.product_id)
        .single()

      if (productError || !product) {
        throw new Error(`Product not found: ${job.product_id}`)
      }

      // Execute the specific job type
      switch (job.job_type) {
        case 'reddit_monitoring':
          await this.executeRedditMonitoringJob(job, product)
          break
        default:
          throw new Error(`Unknown job type: ${job.job_type}`)
      }

      // Update job success and set next run time
      const nextRunTime = new Date()
      nextRunTime.setMinutes(nextRunTime.getMinutes() + job.interval_minutes)
      
      await this.updateJobStatus(
        job.id, 
        'active', 
        null, 
        new Date().toISOString(),
        job.run_count + 1,
        nextRunTime.toISOString()
      )

      console.log(`Job ${job.id} completed successfully`)
    } catch (error) {
      console.error(`Error executing job ${job.id}:`, error)
      
      // Update job with error
      await this.updateJobStatus(
        job.id, 
        'error', 
        error instanceof Error ? error.message : 'Unknown error',
        new Date().toISOString(),
        job.run_count + 1
      )
    }
  }

  // Execute Reddit monitoring job with retry logic
  private async executeRedditMonitoringJob(job: BackgroundJob, product: Product) {
    console.log(`Starting Reddit monitoring for product: ${product.name}`)
    
    const maxRetries = 3
    let retryCount = 0
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Initializing Reddit client for user: ${job.user_id} (attempt ${retryCount + 1})`)
        const redditClient = getRedditClient(job.user_id)
        
        // Wait a bit for the client to initialize
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Check if client is properly initialized
        console.log(`Reddit client initialized: ${redditClient.isInitialized}`)
        
        if (!redditClient.isInitialized) {
          throw new Error('Reddit account not connected or token expired. Please reconnect your Reddit account to search for leads.')
        }
        
        const searchTerms = redditClient.generateSearchTerms(product)
        console.log(`Generated search terms: ${searchTerms.slice(0, 5).join(', ')}...`)
        
        let totalLeadsFound = 0
        
        // Search in each subreddit with retry logic
        for (const subreddit of product.subreddits) {
          console.log(`Searching in r/${subreddit} for product: ${product.name}`)
          
          try {
            // Use advanced search with multiple strategies for better results
            const posts = await this.searchSubredditAdvancedWithRetry(redditClient, subreddit, searchTerms, product)
            
            console.log(`Found ${posts.length} posts in r/${subreddit}`)
            
            // Process each post
            for (const post of posts) {
              try {
                const relevanceScore = await this.calculateRelevanceScore(post, product)
                console.log(`Post "${post.title}" - Relevance score: ${relevanceScore}`)
                
                // Only save leads with score >= 5 (lowered threshold for testing)
                if (relevanceScore >= 5) {
                  await this.saveLead(job.user_id, product.id, post, relevanceScore, 'post')
                  totalLeadsFound++
                  console.log(`Saved post lead: ${post.title} (Score: ${relevanceScore})`)
                }

                // Also search comments in this post for additional leads
                try {
                  const commentLeads = await this.searchPostComments(redditClient, post, product, job.user_id)
                  totalLeadsFound += commentLeads
                  console.log(`Found ${commentLeads} comment leads in post: ${post.title}`)
                } catch (commentError) {
                  console.error(`Error searching comments in post ${post.id}:`, commentError)
                  // Continue with other posts even if comment search fails
                }
              } catch (postError) {
                console.error(`Error processing post ${post.id}:`, postError)
                // Continue with other posts
              }
            }
          } catch (subredditError) {
            console.error(`Error searching in r/${subreddit}:`, subredditError)
            
            // If it's a rate limit error, wait longer before retrying
            if (subredditError.message?.includes('rate limit') || subredditError.message?.includes('429')) {
              console.log('Rate limit detected, waiting 60 seconds...')
              await new Promise(resolve => setTimeout(resolve, 60000))
            }
            
            // Continue with other subreddits
          }
        }
        
        console.log(`Reddit monitoring completed for product: ${product.name}. Found ${totalLeadsFound} leads.`)
        
        // If we get here, the job completed successfully
        return
        
      } catch (error) {
        retryCount++
        console.error(`Error in Reddit monitoring for product ${product.name} (attempt ${retryCount}):`, error)
        
        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 1000 // Exponential backoff
          console.log(`Retrying in ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          console.error(`Max retries reached for product ${product.name}. Job will be marked as failed.`)
          throw error
        }
      }
    }
  }

  // Advanced subreddit search with retry logic
  private async searchSubredditAdvancedWithRetry(redditClient: any, subreddit: string, searchTerms: string[], product: any): Promise<any[]> {
    const maxRetries = 3
    let retryCount = 0
    
    while (retryCount < maxRetries) {
      try {
        return await this.searchSubredditAdvanced(redditClient, subreddit, searchTerms, product)
      } catch (error) {
        retryCount++
        console.error(`Error searching r/${subreddit} (attempt ${retryCount}):`, error)
        
        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 1000 // Exponential backoff
          console.log(`Retrying r/${subreddit} search in ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          console.error(`Max retries reached for r/${subreddit}. Returning empty results.`)
          return []
        }
      }
    }
    
    return []
  }

  // Advanced subreddit search with multiple strategies
  private async searchSubredditAdvanced(redditClient: any, subreddit: string, searchTerms: string[], product: any): Promise<any[]> {
    const allPosts = new Map<string, any>()
    
    try {
      // Strategy 1: Search with product name (exact and variations)
      if (product.name) {
        const nameVariations = [
          product.name,
          `"${product.name}"`,
          product.name.toLowerCase(),
          product.name.split(' ')[0] // First word only
        ]
        
        for (const nameQuery of nameVariations) {
          try {
            const namePosts = await redditClient.searchPosts({
              subreddit: subreddit,
              query: nameQuery,
              sort: 'relevance',
              time: 'year',
              limit: 30
            })
            namePosts.forEach((post: any) => allPosts.set(post.id, post))
          } catch (error) {
            console.log(`Name search failed for "${nameQuery}":`, error.message)
          }
        }
      }
      
      // Strategy 2: Search with pain points (most important for lead quality)
      if (product.pain_points && product.pain_points.length > 0) {
        const painPointQueries = [
          product.pain_points.slice(0, 2).join(' OR '),
          product.pain_points.slice(0, 3).map(p => `"${p}"`).join(' OR '),
          product.pain_points[0] + ' problem',
          product.pain_points[0] + ' issue',
          'struggling with ' + product.pain_points[0]
        ]
        
        for (const painQuery of painPointQueries) {
          try {
            const painPosts = await redditClient.searchPosts({
              subreddit: subreddit,
              query: painQuery,
              sort: 'relevance',
              time: 'year',
              limit: 30
            })
            painPosts.forEach((post: any) => allPosts.set(post.id, post))
          } catch (error) {
            console.log(`Pain point search failed for "${painQuery}":`, error.message)
          }
        }
      }
      
      // Strategy 3: Search with buying intent keywords
      const buyingIntentQueries = [
        'looking for ' + product.name,
        'need ' + product.name,
        'recommend ' + product.name,
        'best ' + product.name,
        'alternative to ' + product.name,
        'replacing ' + product.name
      ]
      
      for (const intentQuery of buyingIntentQueries) {
        try {
          const intentPosts = await redditClient.searchPosts({
            subreddit: subreddit,
            query: intentQuery,
            sort: 'relevance',
            time: 'year',
            limit: 25
          })
          intentPosts.forEach((post: any) => allPosts.set(post.id, post))
        } catch (error) {
          console.log(`Intent search failed for "${intentQuery}":`, error.message)
        }
      }
      
      // Strategy 4: Search with key features (more targeted)
      if (product.features && product.features.length > 0) {
        const featureQueries = product.features.slice(0, 3).map(feature => [
          feature,
          `"${feature}"`,
          feature + ' tool',
          feature + ' solution'
        ]).flat()
        
        for (const featureQuery of featureQueries) {
          try {
            const featurePosts = await redditClient.searchPosts({
              subreddit: subreddit,
              query: featureQuery,
              sort: 'relevance',
              time: 'year',
              limit: 25
            })
            featurePosts.forEach((post: any) => allPosts.set(post.id, post))
          } catch (error) {
            console.log(`Feature search failed for "${featureQuery}":`, error.message)
          }
        }
      }
      
      // Strategy 5: Search with benefits
      if (product.benefits && product.benefits.length > 0) {
        const benefitQueries = product.benefits.slice(0, 2).map(benefit => [
          benefit,
          `"${benefit}"`,
          'achieve ' + benefit,
          'get ' + benefit
        ]).flat()
        
        for (const benefitQuery of benefitQueries) {
          try {
            const benefitPosts = await redditClient.searchPosts({
              subreddit: subreddit,
              query: benefitQuery,
              sort: 'relevance',
              time: 'year',
              limit: 20
            })
            benefitPosts.forEach((post: any) => allPosts.set(post.id, post))
          } catch (error) {
            console.log(`Benefit search failed for "${benefitQuery}":`, error.message)
          }
        }
      }
      
      // Strategy 6: Search for questions and help requests
      const questionQueries = [
        'how to ' + product.name,
        'what is ' + product.name,
        'best way to ' + product.name,
        'help with ' + product.name,
        'anyone know ' + product.name
      ]
      
      for (const questionQuery of questionQueries) {
        try {
          const questionPosts = await redditClient.searchPosts({
            subreddit: subreddit,
            query: questionQuery,
            sort: 'relevance',
            time: 'year',
            limit: 20
          })
          questionPosts.forEach((post: any) => allPosts.set(post.id, post))
        } catch (error) {
          console.log(`Question search failed for "${questionQuery}":`, error.message)
        }
      }
      
      // Strategy 7: Get recent hot posts for broader coverage (reduced limit)
      try {
        const recentPosts = await redditClient.getRecentPosts(subreddit, 50)
        recentPosts.forEach((post: any) => allPosts.set(post.id, post))
      } catch (error) {
        console.log(`Recent posts search failed:`, error.message)
      }
      
      // Strategy 8: Get top posts from the past week
      try {
        const topPosts = await redditClient.searchPosts({
          subreddit: subreddit,
          query: '*',
          sort: 'top',
          time: 'week',
          limit: 30
        })
        topPosts.forEach((post: any) => allPosts.set(post.id, post))
      } catch (error) {
        console.log(`Top posts search failed:`, error.message)
      }
      
      return Array.from(allPosts.values())
    } catch (error) {
      console.error(`Advanced search error for r/${subreddit}:`, error)
      // Fallback to recent posts only
      try {
        return await redditClient.getRecentPosts(subreddit, 50)
      } catch (fallbackError) {
        console.error(`Fallback search also failed:`, fallbackError)
        return []
      }
    }
  }

  // Calculate relevance score for a post
  private async calculateRelevanceScore(post: any, product: Product): Promise<number> {
    let score = 0
    let qualityMultiplier = 1.0
    
    const postText = `${post.title} ${post.selftext}`.toLowerCase()
    const productName = product.name.toLowerCase()
    
    // Direct product mention (highest priority)
    if (postText.includes(productName)) {
      score += 20
      qualityMultiplier += 0.5
    }
    
    // Enhanced pain point analysis with context
    for (const painPoint of product.pain_points) {
      const painPointLower = painPoint.toLowerCase()
      if (postText.includes(painPointLower)) {
        score += 8
        // Bonus for struggling/need context
        if (postText.includes('struggling') || postText.includes('problem') || postText.includes('issue') || postText.includes('frustrated')) {
          score += 4
          qualityMultiplier += 0.3
        }
        // Bonus for urgency indicators
        if (postText.includes('urgent') || postText.includes('asap') || postText.includes('immediately') || postText.includes('deadline')) {
          score += 3
        }
      }
    }
    
    // Enhanced feature matching with partial matches
    for (const feature of product.features) {
      const featureLower = feature.toLowerCase()
      const featureWords = featureLower.split(' ')
      
      // Exact match
      if (postText.includes(featureLower)) {
        score += 6
        // Bonus for exact phrase matches
        if (postText.includes(`"${featureLower}"`) || postText.includes(`'${featureLower}'`)) {
          score += 3
        }
      }
      // Partial word matches (more flexible)
      else if (featureWords.some(word => word.length > 3 && postText.includes(word))) {
        score += 3
      }
    }
    
    // Enhanced benefit matching
    for (const benefit of product.benefits) {
      const benefitLower = benefit.toLowerCase()
      if (postText.includes(benefitLower)) {
        score += 5
      } else {
        // Partial benefit matching
        const benefitWords = benefitLower.split(' ')
        if (benefitWords.some(word => word.length > 3 && postText.includes(word))) {
          score += 2
        }
      }
    }
    
    // Enhanced buying intent signals with context
    const strongIntentTerms = [
      'looking for', 'need', 'want', 'recommend', 'suggest', 'help with', 
      'struggling', 'best way to', 'how to', 'anyone know', 'suggestions', 
      'alternatives', 'trying to', 'attempting to', 'working on'
    ]
    
    let intentScore = 0
    for (const term of strongIntentTerms) {
      if (postText.includes(term)) {
        intentScore += 2
      }
    }
    
    // Bonus for multiple intent signals
    if (intentScore > 4) {
      score += intentScore + 2
      qualityMultiplier += 0.2
    } else {
      score += intentScore
    }
    
    // Enhanced question analysis
    const questionWords = ['how', 'what', 'where', 'which', 'why', 'when']
    const questionCount = questionWords.filter(word => postText.includes(word)).length
    if (postText.includes('?') && questionCount > 0) {
      score += 3 + questionCount
      qualityMultiplier += 0.1
    }
    
    // Budget/decision maker indicators with higher weights
    const decisionTerms = ['budget', 'cost', 'price', 'expensive', 'cheap', 'free', 'trial', 'demo', 'evaluate', 'compare', 'pricing', 'investment']
    let decisionScore = 0
    for (const term of decisionTerms) {
      if (postText.includes(term)) {
        decisionScore += 2
      }
    }
    
    if (decisionScore > 0) {
      score += decisionScore
      qualityMultiplier += 0.2
    }
    
    // Company size and role indicators
    const roleTerms = ['founder', 'ceo', 'cto', 'manager', 'director', 'owner', 'startup', 'company', 'business', 'team']
    const roleMatches = roleTerms.filter(term => postText.includes(term)).length
    if (roleMatches > 0) {
      score += roleMatches * 2
      qualityMultiplier += 0.1
    }
    
    // Technology stack indicators
    const techTerms = ['api', 'database', 'cloud', 'saas', 'software', 'tool', 'platform', 'integration', 'automation']
    const techMatches = techTerms.filter(term => postText.includes(term)).length
    if (techMatches > 0) {
      score += techMatches
    }
    
    // Engagement and authority indicators (enhanced)
    if (post.score > 50) {
      score += 4
      qualityMultiplier += 0.3
    } else if (post.score > 20) {
      score += 3
      qualityMultiplier += 0.2
    } else if (post.score > 10) {
      score += 2
    } else if (post.score > 5) {
      score += 1
    }
    
    if (post.num_comments > 20) {
      score += 4
      qualityMultiplier += 0.2
    } else if (post.num_comments > 10) {
      score += 3
    } else if (post.num_comments > 5) {
      score += 2
    } else if (post.num_comments > 2) {
      score += 1
    }
    
    // Recent activity bonus (enhanced)
    const postAge = Date.now() / 1000 - post.created_utc
    if (postAge < 6 * 3600) { // Within 6 hours
      score += 4
      qualityMultiplier += 0.3
    } else if (postAge < 24 * 3600) { // Within 24 hours
      score += 3
      qualityMultiplier += 0.2
    } else if (postAge < 3 * 24 * 3600) { // Within 3 days
      score += 2
    } else if (postAge < 7 * 24 * 3600) { // Within 7 days
      score += 1
    }
    
    // Subreddit relevance bonus (enhanced)
    const highValueSubreddits = ['entrepreneur', 'startups', 'smallbusiness', 'freelance', 'marketing', 'sales', 'business', 'saas', 'productivity']
    const mediumValueSubreddits = ['technology', 'programming', 'webdev', 'digitalnomad', 'sideproject', 'indiehackers']
    
    if (highValueSubreddits.some(sub => post.subreddit.toLowerCase().includes(sub))) {
      score += 3
      qualityMultiplier += 0.2
    } else if (mediumValueSubreddits.some(sub => post.subreddit.toLowerCase().includes(sub))) {
      score += 2
    }
    
    // Sentiment analysis (basic)
    const positiveWords = ['great', 'awesome', 'excellent', 'amazing', 'love', 'perfect', 'fantastic']
    const negativeWords = ['terrible', 'awful', 'hate', 'worst', 'horrible', 'sucks', 'broken']
    
    const positiveCount = positiveWords.filter(word => postText.includes(word)).length
    const negativeCount = negativeWords.filter(word => postText.includes(word)).length
    
    if (positiveCount > negativeCount) {
      score += 2
    } else if (negativeCount > positiveCount) {
      score -= 1 // Slight penalty for negative sentiment
    }
    
    // Apply quality multiplier
    const finalScore = Math.round(score * qualityMultiplier)
    
    return Math.min(Math.max(finalScore, 0), 50) // Increased cap and minimum
  }

  // Search comments in a post for additional leads
  private async searchPostComments(redditClient: any, post: any, product: Product, userId: string): Promise<number> {
    try {
      // Only search comments if the post has enough comments to be worth it
      if (post.num_comments < 3) {
        return 0
      }

      console.log(`Searching comments in post: ${post.title} (${post.num_comments} comments)`)
      
      // Get comments from the post
      const comments = await redditClient.getPostComments(post.id)
      
      if (!comments || comments.length === 0) {
        return 0
      }

      let commentLeadsFound = 0
      
      // Process each comment
      for (const comment of comments) {
        // Skip deleted/removed comments
        if (!comment.body || comment.body === '[deleted]' || comment.body === '[removed]') {
          continue
        }

        const commentScore = await this.calculateCommentRelevanceScore(comment, product)
        
        // Only save comment leads with score >= 4 (lowered threshold for testing)
        if (commentScore >= 4) {
          await this.saveLead(userId, product.id, post, commentScore, 'comment', comment)
          commentLeadsFound++
          console.log(`Saved comment lead: "${comment.body.substring(0, 50)}..." - Score: ${commentScore}`)
        }
      }

      return commentLeadsFound
    } catch (error) {
      console.error(`Error searching comments in post ${post.id}:`, error)
      return 0
    }
  }

  // Calculate relevance score for a comment
  private async calculateCommentRelevanceScore(comment: any, product: Product): Promise<number> {
    let score = 0
    let qualityMultiplier = 1.0
    
    const commentText = comment.body.toLowerCase()
    const productName = product.name.toLowerCase()
    
    // Direct product mention (highest priority)
    if (commentText.includes(productName)) {
      score += 15
      qualityMultiplier += 0.4
    }
    
    // Enhanced pain point analysis
    for (const painPoint of product.pain_points) {
      const painPointLower = painPoint.toLowerCase()
      if (commentText.includes(painPointLower)) {
        score += 6
        // Bonus for struggling/need context
        if (commentText.includes('struggling') || commentText.includes('problem') || commentText.includes('issue') || commentText.includes('frustrated')) {
          score += 3
          qualityMultiplier += 0.2
        }
        // Bonus for urgency
        if (commentText.includes('urgent') || commentText.includes('asap') || commentText.includes('immediately')) {
          score += 2
        }
      }
    }
    
    // Enhanced feature matching
    for (const feature of product.features) {
      const featureLower = feature.toLowerCase()
      const featureWords = featureLower.split(' ')
      
      if (commentText.includes(featureLower)) {
        score += 4
        if (commentText.includes(`"${featureLower}"`) || commentText.includes(`'${featureLower}'`)) {
          score += 2
        }
      } else if (featureWords.some(word => word.length > 3 && commentText.includes(word))) {
        score += 2
      }
    }
    
    // Enhanced benefit matching
    for (const benefit of product.benefits) {
      const benefitLower = benefit.toLowerCase()
      if (commentText.includes(benefitLower)) {
        score += 3
      } else {
        const benefitWords = benefitLower.split(' ')
        if (benefitWords.some(word => word.length > 3 && commentText.includes(word))) {
          score += 1
        }
      }
    }
    
    // Enhanced buying intent signals
    const strongIntentTerms = [
      'looking for', 'need', 'want', 'recommend', 'suggest', 'help with', 
      'struggling', 'anyone know', 'best way to', 'how to', 'suggestions', 
      'alternatives', 'tried', 'using', 'switching', 'trying to', 'attempting to'
    ]
    
    let intentScore = 0
    for (const term of strongIntentTerms) {
      if (commentText.includes(term)) {
        intentScore += 2
      }
    }
    
    if (intentScore > 3) {
      score += intentScore + 1
      qualityMultiplier += 0.1
    } else {
      score += intentScore
    }
    
    // Enhanced question analysis
    const questionWords = ['how', 'what', 'where', 'which', 'why', 'when']
    const questionCount = questionWords.filter(word => commentText.includes(word)).length
    if (commentText.includes('?') && questionCount > 0) {
      score += 2 + questionCount
      qualityMultiplier += 0.1
    }
    
    // Experience sharing (people talking about their current situation)
    const experienceTerms = [
      'currently using', 'tried', 'switched from', 'migrating from', 
      'replacing', 'upgrading from', 'working with', 'using', 'have used'
    ]
    const experienceMatches = experienceTerms.filter(term => commentText.includes(term)).length
    if (experienceMatches > 0) {
      score += experienceMatches * 2
      qualityMultiplier += 0.1
    }
    
    // Budget/decision indicators
    const decisionTerms = ['budget', 'cost', 'price', 'expensive', 'cheap', 'free', 'trial', 'demo', 'pricing']
    const decisionMatches = decisionTerms.filter(term => commentText.includes(term)).length
    if (decisionMatches > 0) {
      score += decisionMatches * 2
      qualityMultiplier += 0.1
    }
    
    // Role and company indicators
    const roleTerms = ['founder', 'ceo', 'cto', 'manager', 'director', 'owner', 'startup', 'company', 'business']
    const roleMatches = roleTerms.filter(term => commentText.includes(term)).length
    if (roleMatches > 0) {
      score += roleMatches * 2
      qualityMultiplier += 0.1
    }
    
    // Comment engagement bonus (enhanced)
    if (comment.score > 10) {
      score += 3
      qualityMultiplier += 0.2
    } else if (comment.score > 5) {
      score += 2
    } else if (comment.score > 2) {
      score += 1
    }
    
    // Recent comment bonus (enhanced)
    const commentAge = Date.now() / 1000 - comment.created_utc
    if (commentAge < 6 * 3600) { // Within 6 hours
      score += 3
      qualityMultiplier += 0.2
    } else if (commentAge < 24 * 3600) { // Within 24 hours
      score += 2
    } else if (commentAge < 3 * 24 * 3600) { // Within 3 days
      score += 1
    }
    
    // Sentiment analysis
    const positiveWords = ['great', 'awesome', 'excellent', 'amazing', 'love', 'perfect', 'fantastic', 'helpful']
    const negativeWords = ['terrible', 'awful', 'hate', 'worst', 'horrible', 'sucks', 'broken', 'useless']
    
    const positiveCount = positiveWords.filter(word => commentText.includes(word)).length
    const negativeCount = negativeWords.filter(word => commentText.includes(word)).length
    
    if (positiveCount > negativeCount) {
      score += 2
    } else if (negativeCount > positiveCount) {
      score -= 1
    }
    
    // Apply quality multiplier
    const finalScore = Math.round(score * qualityMultiplier)
    
    return Math.min(Math.max(finalScore, 0), 30) // Increased cap for comments
  }

  // Save a lead to the database
  private async saveLead(userId: string, productId: string, post: any, relevanceScore: number, leadType: 'post' | 'comment' = 'post', commentData?: any) {
    try {
      // Get product data for AI analysis
      const { data: product, error: productError } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        console.error('Error fetching product for AI analysis:', productError)
        return
      }

      // Prepare lead data for AI analysis
      const leadData: LeadData = {
        title: leadType === 'comment' ? `Comment on: ${post.title}` : post.title,
        content: leadType === 'comment' ? commentData?.body : post.selftext,
        author: leadType === 'comment' ? commentData?.author : post.author,
        subreddit: post.subreddit,
        score: leadType === 'comment' ? commentData?.score : post.score,
        numComments: leadType === 'comment' ? 0 : post.num_comments,
        leadType: leadType,
        parentPostTitle: leadType === 'comment' ? post.title : undefined
      }

      const productData: ProductData = {
        name: product.name,
        description: product.description,
        features: product.features || [],
        benefits: product.benefits || [],
        painPoints: product.pain_points || [],
        idealCustomerProfile: product.ideal_customer_profile || ''
      }

      // Perform AI analysis
      let aiAnalysis = null
      try {
        aiAnalysis = await aiLeadAnalyzer.analyzeLead(leadData, productData)
        console.log(`AI analysis completed for ${leadType}: ${aiAnalysis.qualityScore}/10`)
      } catch (aiError) {
        console.error('AI analysis failed:', aiError)
        // Continue without AI analysis
      }

      const leadRecord: any = {
        user_id: userId,
        product_id: productId,
        reddit_post_id: post.id,
        reddit_post_url: post.url,
        title: leadData.title,
        content: leadData.content,
        subreddit: post.subreddit,
        author: leadData.author,
        score: leadData.score,
        num_comments: leadData.numComments,
        relevance_score: relevanceScore,
        status: 'new',
        lead_type: leadType
      }

      // Add comment-specific fields
      if (leadType === 'comment' && commentData) {
        leadRecord.parent_post_id = post.id
        leadRecord.parent_post_title = post.title
        leadRecord.parent_post_url = post.url
        leadRecord.reddit_comment_id = commentData.id
        leadRecord.reddit_comment_url = `${post.url}#${commentData.id}`
      }

      // Add AI analysis if available
      if (aiAnalysis) {
        leadRecord.ai_analysis_reasons = aiAnalysis.reasons
        leadRecord.ai_sample_reply = aiAnalysis.sampleReply
        leadRecord.ai_analysis_score = aiAnalysis.qualityScore
        leadRecord.ai_analysis_timestamp = new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('leads')
        .insert(leadRecord)

      if (error) {
        // If it's a duplicate, that's okay - just log it
        if (error.code === '23505') {
          console.log(`Lead already exists: ${leadType === 'comment' ? commentData?.id : post.id}`)
        } else {
          console.error('Error saving lead:', error)
        }
      } else {
        console.log(`Saved new ${leadType} lead: ${leadType === 'comment' ? commentData?.body?.substring(0, 50) + '...' : post.title}`)
      }
    } catch (error) {
      console.error('Error saving lead:', error)
    }
  }

  // Update job status
  private async updateJobStatus(
    jobId: string, 
    status: string, 
    errorMessage: string | null = null,
    lastRun: string | null = null,
    runCount: number | null = null,
    nextRun: string | null = null
  ) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (errorMessage !== null) {
      updateData.error_message = errorMessage
    }

    if (lastRun !== null) {
      updateData.last_run = lastRun
    }

    if (runCount !== null) {
      updateData.run_count = runCount
    }

    if (nextRun !== null) {
      updateData.next_run = nextRun
    }

    const { error } = await this.supabase
      .from('background_jobs')
      .update(updateData)
      .eq('id', jobId)

    if (error) {
      console.error('Error updating job status:', error)
    }
  }

  // Create a new background job
  async createJob(userId: string, productId: string, jobType: string = 'reddit_monitoring', intervalMinutes: number = 60) {
    try {
      if (!this.supabase) {
        await this.initialize()
      }

      const now = new Date()
      // Set next_run to now so the job runs immediately
      const nextRun = now

      const { data, error } = await this.supabase
        .from('background_jobs')
        .insert({
          user_id: userId,
          product_id: productId,
          job_type: jobType,
          status: 'active',
          interval_minutes: intervalMinutes,
          run_count: 0,
          next_run: nextRun.toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create job: ${error.message}`)
      }

      console.log(`Created background job for product ${productId}`)
      
      // Force immediate execution for testing
      console.log('Forcing immediate job execution for testing...')
      await this.processJobs()
      
      return data
    } catch (error) {
      console.error('Error creating job:', error)
      throw error
    }
  }

  // Stop a background job
  async stopJob(userId: string, productId: string, jobType: string = 'reddit_monitoring') {
    try {
      if (!this.supabase) {
        await this.initialize()
      }

      const { error } = await this.supabase
        .from('background_jobs')
        .update({
          status: 'stopped',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('job_type', jobType)

      if (error) {
        throw new Error(`Failed to stop job: ${error.message}`)
      }

      console.log(`Stopped background job for product ${productId}`)
    } catch (error) {
      console.error('Error stopping job:', error)
      throw error
    }
  }

  // Get job status
  async getJobStatus(userId: string, productId: string, jobType: string = 'reddit_monitoring') {
    try {
      if (!this.supabase) {
        await this.initialize()
      }

      const { data, error } = await this.supabase
        .from('background_jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('job_type', jobType)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get job status: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error getting job status:', error)
      throw error
    }
  }
}

// Global job scheduler instance
let jobScheduler: JobScheduler | null = null
let schedulerStarted = false
let healthCheckInterval: NodeJS.Timeout | null = null

export function getJobScheduler(): JobScheduler {
  if (!jobScheduler) {
    jobScheduler = new JobScheduler()
  }
  return jobScheduler
}

// Auto-start the job scheduler when the module is loaded
export async function initializeJobScheduler() {
  if (!schedulerStarted) {
    try {
      const scheduler = getJobScheduler()
      await scheduler.start()
      schedulerStarted = true
      console.log('Job scheduler auto-started successfully')
      
      // Start health check to ensure scheduler stays running
      startHealthCheck()
    } catch (error) {
      console.error('Failed to auto-start job scheduler:', error)
      // Retry after 30 seconds
      setTimeout(() => {
        schedulerStarted = false
        initializeJobScheduler().catch(console.error)
      }, 30000)
    }
  }
}

// Health check to ensure scheduler stays running
function startHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
  }
  
  healthCheckInterval = setInterval(async () => {
    try {
      const scheduler = getJobScheduler()
      
      if (!scheduler.isRunning) {
        console.log('Job scheduler stopped unexpectedly, restarting...')
        schedulerStarted = false
        await initializeJobScheduler()
      }
      
      // Also check for failed jobs and restart them
      await checkAndRestartFailedJobs()
    } catch (error) {
      console.error('Health check error:', error)
    }
  }, 300000) // Check every 5 minutes
}

// Check for failed jobs and restart them
async function checkAndRestartFailedJobs() {
  try {
    const scheduler = getJobScheduler()
    if (!scheduler.supabase) {
      await scheduler.initialize()
    }
    
    // Get all jobs that have been in error state for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: failedJobs, error } = await scheduler.supabase
      .from('background_jobs')
      .select('*')
      .eq('status', 'error')
      .lt('updated_at', oneHourAgo)
    
    if (error) {
      console.error('Error checking failed jobs:', error)
      return
    }
    
    if (failedJobs && failedJobs.length > 0) {
      console.log(`Found ${failedJobs.length} failed jobs to restart`)
      
      for (const job of failedJobs) {
        try {
          // Reset job to active and schedule for immediate run
          const { error: updateError } = await scheduler.supabase
            .from('background_jobs')
            .update({
              status: 'active',
              error_message: null,
              next_run: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id)
          
          if (updateError) {
            console.error(`Failed to restart job ${job.id}:`, updateError)
          } else {
            console.log(`Restarted failed job ${job.id} for user ${job.user_id}`)
          }
        } catch (jobError) {
          console.error(`Error restarting job ${job.id}:`, jobError)
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAndRestartFailedJobs:', error)
  }
}

// Initialize the scheduler immediately
if (typeof window === 'undefined') {
  // Only run on server side
  initializeJobScheduler().catch(console.error)
  
  // Also try to start scheduler on any API call (for serverless environments)
  // This ensures scheduler starts even if the module loading approach fails
  process.nextTick(async () => {
    try {
      const scheduler = getJobScheduler()
      if (!scheduler.isRunning) {
        console.log('Auto-starting job scheduler on process.nextTick...')
        await scheduler.start()
        schedulerStarted = true
        startHealthCheck()
      }
    } catch (error) {
      console.error('Failed to auto-start scheduler on process.nextTick:', error)
    }
  })
}

