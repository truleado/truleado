import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Update the job to run immediately
    const { error } = await supabase
      .from('background_jobs')
      .update({
        next_run: new Date().toISOString(), // Set to now so it runs immediately
        status: 'active'
      })
      .eq('product_id', productId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating job:', error)
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Job updated to run immediately',
      nextRun: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test job error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to test job'
    }, { status: 500 })
  }
}
