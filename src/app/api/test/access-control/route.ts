export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getAccessLevel, canAccessFeature } from '@/lib/access-control'

export async function GET(request: NextRequest) {
  try {
    // Test with different user types
    const testUsers = [
      {
        id: 'trial-user',
        email: 'trial@truleado.com',
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        trial_count: 1,
        last_trial_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'expired-trial-user',
        email: 'expired@truleado.com',
        subscription_status: 'expired',
        trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        trial_count: 1,
        last_trial_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'paid-user',
        email: 'paid@truleado.com',
        subscription_status: 'active',
        trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago (expired trial)
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        trial_count: 1,
        last_trial_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    const results = testUsers.map(user => {
      const accessLevel = getAccessLevel(user)
      const canAccessPromote = canAccessFeature(user, 'promote_products')
      const canAccessLeads = canAccessFeature(user, 'view_leads')
      const canAccessProducts = canAccessFeature(user, 'view_products')
      
      return {
        user: {
          id: user.id,
          email: user.email,
          subscription_status: user.subscription_status
        },
        accessLevel,
        canAccess: {
          promote_products: canAccessPromote,
          view_leads: canAccessLeads,
          view_products: canAccessProducts
        }
      }
    })

    return NextResponse.json({
      success: true,
      results,
      message: 'Access control test completed'
    })
  } catch (error) {
    console.error('Failed to test access control:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to test access control'
    }, { status: 500 })
  }
}
