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

    // Use the same client for database operations
    const serviceSupabase = supabase

    // Check and update trial status (skip for now to avoid errors)
    // await checkAndUpdateTrialStatus(user.id, serviceSupabase)

    // Get user profile with subscription info
    let { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 })
    }

    // If user has no subscription status or it's null/empty/free, give them a 7-day trial
    if (!profile.subscription_status || profile.subscription_status === 'free' || profile.subscription_status === '') {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 7)
      
      const { data: updatedProfile, error: updateError } = await serviceSupabase
        .from('profiles')
        .update({
          subscription_status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          trial_count: 1,
          last_trial_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error starting trial for user:', updateError)
      } else {
        profile = updatedProfile
      }
    }
    
    // If user has expired trial and no active subscription, check if we should give them a new trial
    // (For now, we only give one trial per user - they need to upgrade after it expires)
    if (profile.subscription_status === 'trial' && profile.trial_ends_at) {
      const now = new Date()
      const trialEndsAt = new Date(profile.trial_ends_at)
      
      // If trial expired, update status to expired
      if (now > trialEndsAt) {
        const { data: updatedProfile, error: updateError } = await serviceSupabase
          .from('profiles')
          .update({
            subscription_status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single()

        if (!updateError && updatedProfile) {
          profile = updatedProfile
        }
      }
    }

    // Calculate next billing date for active subscriptions
    let nextBillingDate = ''
    let isRecurring = false
    
    if (profile.subscription_status === 'active' && profile.subscription_ends_at) {
      const subscriptionEndsAt = new Date(profile.subscription_ends_at)
      nextBillingDate = subscriptionEndsAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      // Check if this is a recurring subscription
      // If subscription_ends_at is more than 30 days from now, it's likely recurring
      const now = new Date()
      const daysUntilRenewal = Math.ceil((subscriptionEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      isRecurring = daysUntilRenewal > 30 || profile.paddle_subscription_id !== null
    }

    // Mock invoice history for active subscribers
    const invoices = profile.subscription_status === 'active' ? [
      {
        id: '1',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        description: 'Pro Plan - Monthly',
        amount: '$49.00',
        status: 'paid'
      },
      {
        id: '2', 
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        description: 'Pro Plan - Monthly',
        amount: '$49.00',
        status: 'paid'
      }
    ] : []

    return NextResponse.json({
      subscription_status: profile.subscription_status,
      trial_ends_at: profile.trial_ends_at,
      subscription_ends_at: profile.subscription_ends_at,
      trial_count: profile.trial_count,
      last_trial_at: profile.last_trial_at,
      paddle_customer_id: profile.paddle_customer_id,
      paddle_subscription_id: profile.paddle_subscription_id,
      next_billing_date: nextBillingDate,
      is_recurring: isRecurring,
      amount: '$49.00',
      payment_method: 'Card ending in 4242',
      invoices: invoices,
      billing_cycle: isRecurring ? 'Monthly' : 'One-time'
    })
  } catch (error) {
    console.error('Billing status error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch billing status'
    }, { status: 500 })
  }
}

async function checkAndUpdateTrialStatus(userId: string, supabase: any): Promise<void> {
  try {
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user for trial status check:', userError)
      return
    }

    if (user.subscription_status === 'trial') {
      const now = new Date()
      const trialEndsAt = new Date(user.trial_ends_at)

      if (now > trialEndsAt) {
        // Trial expired
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'expired'
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating trial status to expired:', updateError)
        }
      }
    }
  } catch (error) {
    console.error('Error checking trial status:', error)
  }
}
