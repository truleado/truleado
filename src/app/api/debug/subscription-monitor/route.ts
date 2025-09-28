import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get all active subscriptions
    const { data: activeSubscriptions, error: activeError } = await supabase
      .from('profiles')
      .select('id, email, subscription_status, paddle_subscription_id, subscription_ends_at, created_at')
      .eq('subscription_status', 'active')
      .order('created_at', 'desc')

    if (activeError) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // Get all subscriptions (for overview)
    const { data: allSubscriptions, error: allError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .not('subscription_status', 'is', null)

    if (allError) {
      return NextResponse.json({ error: 'Failed to fetch all subscriptions' }, { status: 500 })
    }

    // Analyze subscription data
    const now = new Date()
    const analysis = {
      totalSubscriptions: allSubscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      subscriptionsWithPaddleId: activeSubscriptions.filter(sub => sub.paddle_subscription_id).length,
      subscriptionsWithEndDate: activeSubscriptions.filter(sub => sub.subscription_ends_at).length,
      subscriptionsExpiringSoon: activeSubscriptions.filter(sub => {
        if (!sub.subscription_ends_at) return false
        const endDate = new Date(sub.subscription_ends_at)
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0
      }).length,
      subscriptionsExpired: activeSubscriptions.filter(sub => {
        if (!sub.subscription_ends_at) return false
        const endDate = new Date(sub.subscription_ends_at)
        return endDate < now
      }).length
    }

    // Calculate recurring billing health score
    const healthScore = Math.round((
      (analysis.subscriptionsWithPaddleId / Math.max(analysis.activeSubscriptions, 1)) * 100 +
      (analysis.subscriptionsWithEndDate / Math.max(analysis.activeSubscriptions, 1)) * 100
    ) / 2)

    // Get subscription status breakdown
    const statusBreakdown = allSubscriptions.reduce((acc, sub) => {
      acc[sub.subscription_status] = (acc[sub.subscription_status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Check for potential issues
    const issues = []
    
    if (analysis.subscriptionsWithPaddleId < analysis.activeSubscriptions) {
      issues.push(`${analysis.activeSubscriptions - analysis.subscriptionsWithPaddleId} active subscriptions missing Paddle subscription ID`)
    }
    
    if (analysis.subscriptionsWithEndDate < analysis.activeSubscriptions) {
      issues.push(`${analysis.activeSubscriptions - analysis.subscriptionsWithEndDate} active subscriptions missing end date`)
    }
    
    if (analysis.subscriptionsExpired > 0) {
      issues.push(`${analysis.subscriptionsExpired} subscriptions have expired but still marked as active`)
    }
    
    if (analysis.subscriptionsExpiringSoon > 0) {
      issues.push(`${analysis.subscriptionsExpiringSoon} subscriptions expiring within 7 days`)
    }

    return NextResponse.json({
      analysis,
      healthScore,
      statusBreakdown,
      issues,
      activeSubscriptions: activeSubscriptions.map(sub => ({
        id: sub.id,
        email: sub.email,
        paddleSubscriptionId: sub.paddle_subscription_id,
        subscriptionEndsAt: sub.subscription_ends_at,
        daysUntilExpiry: sub.subscription_ends_at ? 
          Math.ceil((new Date(sub.subscription_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 
          'N/A',
        isRecurring: !!sub.paddle_subscription_id,
        createdAt: sub.created_at
      })),
      recommendations: [
        healthScore < 80 ? 'Low health score - check Paddle configuration and webhook setup' : 'Health score looks good',
        analysis.subscriptionsWithPaddleId < analysis.activeSubscriptions ? 'Some subscriptions missing Paddle ID - check webhook processing' : 'All subscriptions have Paddle ID',
        analysis.subscriptionsWithEndDate < analysis.activeSubscriptions ? 'Some subscriptions missing end date - check webhook processing' : 'All subscriptions have end date',
        issues.length > 0 ? 'Issues detected - see issues array for details' : 'No issues detected'
      ]
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to monitor subscriptions'
    }, { status: 500 })
  }
}
