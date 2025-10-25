import { createClient } from '@/lib/supabase-server'
import { getRedditClient } from '@/lib/reddit-client'
import { aiLeadAnalyzer, LeadData, ProductData } from '@/lib/ai-lead-analyzer'
import { aiSearchGenerator } from '@/lib/ai-search-generator'

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
  keywords: string[]
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
      throw new Error('Supabase configuration missing')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Job scheduler initialized with Supabase')
  }

  async start() {
    if (this.isRunning) {
      console.log('Job scheduler is already running')
      return
    }

    if (!this.supabase) {
      await this.initialize()
    }

    this.isRunning = true
    console.log('Job scheduler started')

    // Run jobs every minute
    this.intervalId = setInterval(async () => {
      await this.runJobs()
    }, 60000) // 60 seconds

    // Run immediately
    await this.runJobs()
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Job scheduler stopped')
  }

  private async runJobs() {
    try {
      // Get all active jobs
      const { data: jobs, error } = await this.supabase
        .from('background_jobs')
        .select('*')
        .eq('status', 'active')
        .lte('next_run', new Date().toISOString())

      if (error) {
        console.error('Error fetching jobs:', error)
        return
      }

      if (!jobs || jobs.length === 0) {
        return
      }

      console.log(`Running ${jobs.length} jobs`)

      for (const job of jobs) {
        try {
          await this.executeJob(job)
        } catch (jobError) {
          console.error(`Error executing job ${job.id}:`, jobError)
          await this.updateJobStatus(job.id, 'error', jobError instanceof Error ? jobError.message : 'Unknown error')
        }
      }
    } catch (error) {
      console.error('Error in runJobs:', error)
    }
  }

  private async executeJob(job: BackgroundJob) {
    console.log(`Executing job ${job.id} for product ${job.product_id}`)

    // Get product details
    const { data: product, error: productError } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', job.product_id)
      .eq('status', 'active')
      .single()

    if (productError || !product) {
      console.error(`Product not found or inactive: ${job.product_id}`)
      await this.updateJobStatus(job.id, 'error', 'Product not found or inactive')
      return
    }

    // Execute Reddit monitoring job
    if (job.job_type === 'reddit_monitoring') {
      await this.executeRedditMonitoringJob(job, product)
    }

    // Update job status
    await this.updateJobStatus(job.id, 'active', null, new Date().toISOString())
  }

  private async executeRedditMonitoringJob(job: BackgroundJob, product: Product) {
    try {
      const redditClient = getRedditClient()
      
        // Generate AI-powered search terms
        const productData = {
          name: product.name,
          description: product.description || '',
          features: product.features || [],
          benefits: product.benefits || [],
          painPoints: product.pain_points || [],
          idealCustomerProfile: product.ideal_customer_profile || ''
        }
        
        const searchStrategy = await aiSearchGenerator.generateSearchTerms(productData)
        
        // Combine all search terms for comprehensive searching
        const allSearchTerms = [
          ...searchStrategy.problemTerms,
          ...searchStrategy.solutionTerms,
          ...searchStrategy.industryTerms,
          ...searchStrategy.conversationTerms,
          ...searchStrategy.urgencyTerms,
          ...searchStrategy.toolTerms
        ].filter(term => term && term.length > 2) // Filter out short/empty terms
        
        console.log(`Generated ${allSearchTerms.length} search terms for ${product.name}:`, allSearchTerms.slice(0, 10))
        
        const subreddits = product.subreddits || ['entrepreneur', 'smallbusiness', 'startups']
      
      console.log(`Searching for leads for product: ${product.name}`)
      
      // Search in each subreddit
      for (const subreddit of subreddits.slice(0, 3)) { // Limit to 3 subreddits
        try {
          console.log(`Searching r/${subreddit} for product: ${product.name}`)
          
          // Search with AI-generated search terms
          let posts: any[] = []
          if (allSearchTerms.length > 0) {
            posts = await redditClient.searchPostsWithKeywords(subreddit, allSearchTerms, 5)
          } else {
            // Fallback to basic search if no terms generated
            posts = await redditClient.searchPosts({
              subreddit: subreddit,
              query: product.name,
              sort: 'hot',
              limit: 5
            })
          }
          
          console.log(`Found ${posts.length} posts in r/${subreddit}`)
          
          // Process each post with AI analysis
          for (const post of posts) {
            try {
              const leadData = {
                title: post.title,
                content: post.selftext,
                subreddit: post.subreddit,
                author: post.author,
                score: post.score,
                numComments: post.num_comments,
                leadType: 'post' as const
              }

              const productData = {
                name: product.name,
                description: product.description,
                features: product.features || [],
                benefits: product.benefits || [],
                painPoints: product.pain_points || [],
                idealCustomerProfile: product.ideal_customer_profile || ''
              }

              // Analyze with AI (with fallback for missing API keys)
              let aiAnalysis = null
              try {
                aiAnalysis = await aiLeadAnalyzer.analyzeLead(leadData, productData)
                console.log(`AI analysis completed for post: ${post.title.substring(0, 50)}... (Score: ${aiAnalysis.qualityScore})`)
              } catch (aiError) {
                console.error('AI analysis failed:', aiError)
                // Create a basic analysis fallback
                aiAnalysis = {
                  qualityScore: 5, // Medium score for fallback
                  reasons: ['AI analysis unavailable - using basic relevance check'],
                  sampleReply: 'This looks like it could be relevant to your product. Consider reaching out to learn more about their specific needs.',
                  confidence: 0.5
                }
              }
              
              // Save leads with medium+ relevance score (lowered threshold for fallback)
              const minScore = aiAnalysis ? 5 : 3 // Lower threshold if AI failed
              if (aiAnalysis && aiAnalysis.qualityScore >= minScore) {
                // Check if lead already exists
                const { data: existingLead } = await this.supabase
                  .from('leads')
                  .select('id')
                  .eq('user_id', job.user_id)
                  .eq('url', post.permalink)
                  .single()

                if (!existingLead) {
                  const lead = {
                    title: post.title,
                    content: post.selftext,
                    subreddit: post.subreddit,
                    author: post.author,
                    url: post.permalink,
                    score: post.score,
                    num_comments: post.num_comments,
                    product_id: product.id,
                    relevance_score: aiAnalysis.qualityScore,
                    ai_analysis_reasons: aiAnalysis.reasons,
                    ai_sample_reply: aiAnalysis.sampleReply,
                    ai_analysis_score: aiAnalysis.confidence,
                    lead_type: "post",
                    status: "new",
                    user_id: job.user_id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }

                  const { error: leadError } = await this.supabase
                    .from('leads')
                    .insert(lead)

                  if (!leadError) {
                    console.log(`Saved real lead: ${post.title} (Score: ${aiAnalysis.qualityScore})`)
                  } else {
                    console.error('Error saving lead:', leadError)
                  }
                }
              }
            } catch (postError) {
              console.error(`Error processing post ${post.id}:`, postError)
            }
          }
        } catch (subredditError) {
          console.error(`Error searching r/${subreddit}:`, subredditError)
        }
      }
    } catch (error) {
      console.error('Error in Reddit monitoring job:', error)
      throw error
    }
  }

  private async updateJobStatus(jobId: string, status: string, errorMessage: string | null, lastRun?: string) {
    const updateData: any = {
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    }

    if (lastRun) {
      updateData.last_run = lastRun
      updateData.run_count = await this.getRunCount(jobId) + 1
      
      // Calculate next run time
      const { data: job } = await this.supabase
        .from('background_jobs')
        .select('interval_minutes')
        .eq('id', jobId)
        .single()
      
      if (job) {
        const nextRun = new Date()
        nextRun.setMinutes(nextRun.getMinutes() + job.interval_minutes)
        updateData.next_run = nextRun.toISOString()
      }
    }

    await this.supabase
      .from('background_jobs')
      .update(updateData)
      .eq('id', jobId)
  }

  private async getRunCount(jobId: string): Promise<number> {
    const { data: job } = await this.supabase
      .from('background_jobs')
      .select('run_count')
      .eq('id', jobId)
      .single()
    
    return job?.run_count || 0
  }

  async createJob(userId: string, productId: string, jobType: string, intervalMinutes: number) {
    if (!this.supabase) {
      await this.initialize()
    }

    const nextRun = new Date()
    nextRun.setMinutes(nextRun.getMinutes() + intervalMinutes)

    const { data, error } = await this.supabase
      .from('background_jobs')
      .insert({
        user_id: userId,
        product_id: productId,
        job_type: jobType,
        status: 'active',
        interval_minutes: intervalMinutes,
        next_run: nextRun.toISOString(),
        run_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating job:', error)
      throw error
    }

    console.log(`Created job ${data.id} for product ${productId}`)
    return data
  }
}

// Global job scheduler instance
let jobScheduler: JobScheduler | null = null

export function getJobScheduler(): JobScheduler {
  if (!jobScheduler) {
    jobScheduler = new JobScheduler()
  }
  return jobScheduler
}