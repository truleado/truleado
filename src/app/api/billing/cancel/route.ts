import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { dodoPaymentsAPI } from '@/lib/dodo-payments-config'
import { trialManager } from '@/lib/trial-manager'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('dodo_subscription_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.dodo_subscription_id) {
      console.error('Error fetching subscription ID or no subscription found:', profileError)
      return NextResponse.json({ error: 'No active subscription found to cancel' }, { status: 404 })
    }

    const subscriptionId = profile.dodo_subscription_id
    console.log(`Attempting to cancel Dodo Payments subscription: ${subscriptionId} for user: ${user.id}`)

    const cancelledSubscription = await dodoPaymentsAPI.cancelSubscription(subscriptionId)
    console.log('Dodo Payments subscription cancelled:', cancelledSubscription.id)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'cancelled' })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user profile subscription status:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription status in database' }, { status: 500 })
    }

    await trialManager.logSubscriptionChange(
      user.id,
      'cancelled',
      'active', // Assuming it was active before cancellation
      'subscription_cancelled_by_user',
      `webhook_manual_cancel_${Date.now()}`, // Unique ID for manual cancellation
      { subscription_id: subscriptionId }
    )

    return NextResponse.json({ message: 'Subscription cancelled successfully', subscriptionId: cancelledSubscription.id })
  } catch (error) {
    console.error('Error in subscription cancellation API:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    }, { status: 500 })
  }
}
