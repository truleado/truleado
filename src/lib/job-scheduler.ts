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
    
    if (!supabaseKey) {
      throw new Error('No Supabase key found')
    }
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey
    )
    
    console.log('Job scheduler initialized with Supabase client')
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
          throw new Error('Reddit account not connected. Please connect your Reddit account to search for leads.')
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
                
                // Only save leads with score >= 7 (slightly lower threshold for more leads)
                if (relevanceScore >= 7) {
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
      // Strategy 1: Search with product name
      if (product.name) {
        const namePosts = await redditClient.searchPosts({
          subreddit: subreddit,
          query: product.name,
          sort: 'relevance',
          time: 'year',
          limit: 50
        })
        namePosts.forEach((post: any) => allPosts.set(post.id, post))
      }
      
      // Strategy 2: Search with key features
      if (product.features && product.features.length > 0) {
        const featurePosts = await redditClient.searchPosts({
          subreddit: subreddit,
          query: product.features.slice(0, 3).join(' OR '),
          sort: 'relevance',
          time: 'year',
          limit: 50
        })
        featurePosts.forEach((post: any) => allPosts.set(post.id, post))
      }
      
      // Strategy 3: Search with pain points
      if (product.pain_points && product.pain_points.length > 0) {
        const painPointPosts = await redditClient.searchPosts({
          subreddit: subreddit,
          query: product.pain_points.slice(0, 3).join(' OR '),
          sort: 'relevance',
          time: 'year',
          limit: 50
        })
        painPointPosts.forEach((post: any) => allPosts.set(post.id, post))
      }
      
      // Strategy 4: Get recent hot posts for broader coverage
      const recentPosts = await redditClient.getRecentPosts(subreddit, 100)
      recentPosts.forEach((post: any) => allPosts.set(post.id, post))
      
      return Array.from(allPosts.values())
    } catch (error) {
      console.error(`Advanced search error for r/${subreddit}:`, error)
      // Fallback to recent posts only
      return await redditClient.getRecentPosts(subreddit, 100)
    }
  }

  // Calculate relevance score for a post
  private async calculateRelevanceScore(post: any, product: Product): Promise<number> {
    let score = 0
    
    const postText = `${post.title} ${post.selftext}`.toLowerCase()
    const productName = product.name.toLowerCase()
    
    // Direct product mention (highest priority)
    if (postText.includes(productName)) {
      score += 15
    }
    
    // Exact feature matches (higher weight)
    for (const feature of product.features) {
      const featureLower = feature.toLowerCase()
      if (postText.includes(featureLower)) {
        score += 4
        // Bonus for exact phrase matches
        if (postText.includes(`"${featureLower}"`) || postText.includes(`'${featureLower}'`)) {
          score += 2
        }
      }
    }
    
    // Pain point mentions (high weight - these are buying signals)
    for (const painPoint of product.pain_points) {
      const painPointLower = painPoint.toLowerCase()
      if (postText.includes(painPointLower)) {
        score += 5
        // Bonus for struggling/need context
        if (postText.includes('struggling') || postText.includes('problem') || postText.includes('issue')) {
          score += 2
        }
      }
    }
    
    // Benefit mentions
    for (const benefit of product.benefits) {
      if (postText.includes(benefit.toLowerCase())) {
        score += 3
      }
    }
    
    // Strong buying intent signals
    const strongIntentTerms = ['looking for', 'need', 'want', 'recommend', 'suggest', 'help with', 'struggling', 'best way to', 'how to', 'anyone know', 'suggestions', 'alternatives']
    for (const term of strongIntentTerms) {
      if (postText.includes(term)) {
        score += 2
      }
    }
    
    // Question indicators (people asking for help)
    if (postText.includes('?') && (postText.includes('how') || postText.includes('what') || postText.includes('where') || postText.includes('which'))) {
      score += 2
    }
    
    // Budget/decision maker indicators
    const decisionTerms = ['budget', 'cost', 'price', 'expensive', 'cheap', 'free', 'trial', 'demo', 'evaluate', 'compare']
    for (const term of decisionTerms) {
      if (postText.includes(term)) {
        score += 1
      }
    }
    
    // Engagement and authority indicators
    if (post.score > 20) score += 2
    else if (post.score > 10) score += 1
    
    if (post.num_comments > 10) score += 2
    else if (post.num_comments > 5) score += 1
    
    // Recent activity bonus
    const postAge = Date.now() / 1000 - post.created_utc
    if (postAge < 24 * 3600) { // Within 24 hours
      score += 2
    } else if (postAge < 7 * 24 * 3600) { // Within 7 days
      score += 1
    }
    
    // Subreddit relevance bonus
    const relevantSubreddits = ['entrepreneur', 'startups', 'smallbusiness', 'freelance', 'marketing', 'sales', 'business']
    if (relevantSubreddits.some(sub => post.subreddit.toLowerCase().includes(sub))) {
      score += 1
    }
    
    return Math.min(score, 20) // Increased cap for better granularity
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
        
        // Only save comment leads with score >= 6 (higher threshold for better quality)
        if (commentScore >= 6) {
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
    
    const commentText = comment.body.toLowerCase()
    const productName = product.name.toLowerCase()
    
    // Direct product mention (highest priority)
    if (commentText.includes(productName)) {
      score += 12
    }
    
    // Exact feature matches
    for (const feature of product.features) {
      const featureLower = feature.toLowerCase()
      if (commentText.includes(featureLower)) {
        score += 3
        // Bonus for exact phrase matches
        if (commentText.includes(`"${featureLower}"`) || commentText.includes(`'${featureLower}'`)) {
          score += 2
        }
      }
    }
    
    // Pain point mentions (high weight - these are buying signals)
    for (const painPoint of product.pain_points) {
      const painPointLower = painPoint.toLowerCase()
      if (commentText.includes(painPointLower)) {
        score += 4
        // Bonus for struggling/need context
        if (commentText.includes('struggling') || commentText.includes('problem') || commentText.includes('issue')) {
          score += 2
        }
      }
    }
    
    // Benefit mentions
    for (const benefit of product.benefits) {
      if (commentText.includes(benefit.toLowerCase())) {
        score += 2
      }
    }
    
    // Strong buying intent signals
    const strongIntentTerms = ['looking for', 'need', 'want', 'recommend', 'suggest', 'help with', 'struggling', 'anyone know', 'best way to', 'how to', 'suggestions', 'alternatives', 'tried', 'using', 'switching']
    for (const term of strongIntentTerms) {
      if (commentText.includes(term)) {
        score += 2
      }
    }
    
    // Question indicators (people asking for help)
    if (commentText.includes('?') && (commentText.includes('how') || commentText.includes('what') || commentText.includes('where') || commentText.includes('which'))) {
      score += 2
    }
    
    // Experience sharing (people talking about their current situation)
    const experienceTerms = ['currently using', 'tried', 'switched from', 'migrating from', 'replacing', 'upgrading from']
    for (const term of experienceTerms) {
      if (commentText.includes(term)) {
        score += 2
      }
    }
    
    // Comment engagement bonus
    if (comment.score > 5) score += 2
    else if (comment.score > 2) score += 1
    
    // Recent comment bonus (within last 7 days)
    const commentAge = Date.now() / 1000 - comment.created_utc
    if (commentAge < 24 * 3600) { // Within 24 hours
      score += 2
    } else if (commentAge < 7 * 24 * 3600) { // Within 7 days
      score += 1
    }
    
    return Math.min(score, 20) // Increased cap for better granularity
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
