import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Get unread notifications for the user
    const { data: notifications, error } = await supabase
      .from('browser_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      notifications: notifications || []
    })

  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { notificationIds } = await request.json()
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Notification IDs are required' }, { status: 400 })
    }

    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Mark notifications as read
    const { error: updateError } = await supabase
      .from('browser_notifications')
      .update({ read: true })
      .in('id', notificationIds)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error marking notifications as read:', updateError)
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications marked as read' 
    })

  } catch (error) {
    console.error('Mark notifications read error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
