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

    const userId = user.id
    const activities: any[] = []

    // Get recent leads (last 10)
    const { data: recentLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, title, created_at, lead_type, products(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!leadsError && recentLeads) {
      recentLeads.forEach((lead: any) => {
        const timeAgo = getTimeAgo(new Date(lead.created_at))
        activities.push({
          id: `lead-${lead.id}`,
          type: 'lead',
          message: `New ${lead.lead_type} lead found: "${lead.title.substring(0, 50)}${lead.title.length > 50 ? '...' : ''}"`,
          time: timeAgo,
          icon: 'Users',
          productName: lead.products?.name || 'Unknown Product'
        })
      })
    }

    // Get recent products (last 5)
    const { data: recentProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    if (!productsError && recentProducts) {
      recentProducts.forEach((product: any) => {
        const timeAgo = getTimeAgo(new Date(product.created_at))
        activities.push({
          id: `product-${product.id}`,
          type: 'product',
          message: `Product added: "${product.name}"`,
          time: timeAgo,
          icon: 'Package'
        })
      })
    }

    // Get recent background job activities
    const { data: recentJobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('id, status, last_run, error_message, products(name)')
      .eq('user_id', userId)
      .order('last_run', { ascending: false })
      .limit(3)

    if (!jobsError && recentJobs) {
      recentJobs.forEach((job: any) => {
        if (job.last_run) {
          const timeAgo = getTimeAgo(new Date(job.last_run))
          const isError = job.status === 'error'
          const isSuccess = job.status === 'active' && !job.error_message
          
          let message = ''
          if (isError) {
            message = `Lead discovery failed for "${job.products?.name || 'Unknown Product'}": ${job.error_message || 'Unknown error'}`
          } else if (isSuccess) {
            message = `Lead discovery completed for "${job.products?.name || 'Unknown Product'}"`
          } else {
            message = `Lead discovery ${job.status} for "${job.products?.name || 'Unknown Product'}"`
          }

          activities.push({
            id: `job-${job.id}`,
            type: 'job',
            message,
            time: timeAgo,
            icon: isError ? 'AlertCircle' : isSuccess ? 'CheckCircle' : 'Activity'
          })
        }
      })
    }

    // Sort activities by time (most recent first)
    activities.sort((a, b) => {
      const timeA = getTimeInMinutes(a.time)
      const timeB = getTimeInMinutes(b.time)
      return timeA - timeB
    })

    // Return only the 10 most recent activities
    return NextResponse.json(activities.slice(0, 10))
  } catch (error) {
    console.error('Dashboard activity error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard activity'
    }, { status: 500 })
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `${weeks}w ago`
  }
}

function getTimeInMinutes(timeString: string): number {
  if (timeString === 'Just now') return 0
  
  const match = timeString.match(/(\d+)([mhdw])/)
  if (!match) return 999999
  
  const value = parseInt(match[1])
  const unit = match[2]
  
  switch (unit) {
    case 'm': return value
    case 'h': return value * 60
    case 'd': return value * 60 * 24
    case 'w': return value * 60 * 24 * 7
    default: return 999999
  }
}
