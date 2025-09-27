import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { NotificationService } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const { leadId, userId, productId } = await request.json()
    
    if (!leadId || !userId || !productId) {
      return NextResponse.json({ 
        error: 'leadId, userId, and productId are required' 
      }, { status: 400 })
    }

    const supabase = createClient()
    
    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id,
        title,
        content,
        subreddit,
        author,
        score,
        reddit_post_url,
        products(name),
        profiles(user_email:auth.users(email, user_metadata))
      `)
      .eq('id', leadId)
      .eq('user_id', userId)
      .single()

    if (leadError || !lead) {
      console.error('Error fetching lead:', leadError)
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get user email
    const userEmail = lead.profiles?.user_email?.email
    const userName = lead.profiles?.user_email?.user_metadata?.full_name || 'User'

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    // Send notification
    const result = await NotificationService.sendNewLeadNotification({
      userId: userId,
      leadId: lead.id,
      productName: lead.products?.name || 'Unknown Product',
      subreddit: lead.subreddit,
      title: lead.title,
      content: lead.content || '',
      author: lead.author,
      score: lead.score || 0,
      url: `/leads/${lead.id}`,
      userEmail: userEmail,
      userName: userName
    })

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'New lead notification sent successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('New lead notification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
