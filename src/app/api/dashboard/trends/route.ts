export const dynamic = 'force-dynamic';
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
    const trends = []

    // Get leads for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())

      if (error) {
        console.error(`Error fetching leads for ${date.toISOString()}:`, error)
      }

      trends.push({
        date: date.toISOString().split('T')[0],
        count: count || 0,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
      })
    }

    return NextResponse.json(trends)
  } catch (error) {
    console.error('Dashboard trends error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard trends'
    }, { status: 500 })
  }
}
