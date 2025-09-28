import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionId } = await request.json()
    
    if (!userId || !subscriptionId) {
      return NextResponse.json({ 
        error: 'userId and subscriptionId are required' 
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate next billing date (30 days from now)
    const nextBillingDate = new Date()
    nextBillingDate.setDate(nextBillingDate.getDate() + 30)

    // Update subscription with new billing date
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_ends_at: nextBillingDate.toISOString(),
        paddle_subscription_id: subscriptionId
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Recurring payment simulated successfully',
      userId,
      subscriptionId,
      nextBillingDate: nextBillingDate.toISOString(),
      nextBillingDateFormatted: nextBillingDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      instructions: [
        'This simulates a successful recurring payment',
        'The subscription_ends_at has been updated to 30 days from now',
        'Check the billing status to verify the next billing date',
        'This is for testing purposes only - not a real payment'
      ]
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to simulate recurring payment'
    }, { status: 500 })
  }
}
