import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key for debugging
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseKey) {
      return NextResponse.json({ error: 'No Supabase key found' }, { status: 500 })
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey
    )

    // Get all jobs
    const { data: jobs, error } = await supabase
      .from('background_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get current time for comparison
    const now = new Date().toISOString()

    return NextResponse.json({
      currentTime: now,
      totalJobs: jobs?.length || 0,
      jobs: jobs?.map(job => ({
        id: job.id,
        user_id: job.user_id,
        product_id: job.product_id,
        status: job.status,
        next_run: job.next_run,
        isDue: job.next_run <= now,
        created_at: job.created_at,
        updated_at: job.updated_at
      })) || []
    })
  } catch (error) {
    console.error('Debug jobs error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}