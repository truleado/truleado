export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { PaddleAPI } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    const paddleAPI = new PaddleAPI()
    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || ''
    
    if (!priceId) {
      return NextResponse.json({ 
        error: 'No price ID configured',
        recommendation: 'Set NEXT_PUBLIC_PADDLE_PRICE_ID environment variable'
      }, { status: 400 })
    }

    // Get price details
    const price = await paddleAPI.getPrice(priceId)
    
    // Analyze the price configuration
    const analysis = {
      priceId: price.id,
      name: price.name,
      type: price.type,
      status: price.status,
      billingCycle: price.billingCycle,
      isRecurring: price.type === 'recurring' || (price.billingCycle && price.billingCycle.interval),
      hasBillingCycle: !!price.billingCycle,
      billingInterval: price.billingCycle?.interval || 'N/A',
      billingFrequency: price.billingCycle?.frequency || 'N/A',
      unitPrice: price.unitPrice,
      currencyCode: price.unitPrice?.currencyCode || 'N/A'
    }

    // Determine if this is properly configured for recurring billing
    const isProperlyConfigured = analysis.isRecurring && analysis.hasBillingCycle && analysis.billingInterval === 'month'

    const recommendations = []
    
    if (!analysis.isRecurring) {
      recommendations.push('❌ Price is not configured as recurring')
      recommendations.push('Go to Paddle Dashboard → Catalog → Products')
      recommendations.push('Edit this price and set type to "Recurring"')
    }
    
    if (!analysis.hasBillingCycle) {
      recommendations.push('❌ No billing cycle configured')
      recommendations.push('Set billing cycle to "Monthly" in Paddle Dashboard')
    }
    
    if (analysis.billingInterval !== 'month') {
      recommendations.push(`❌ Billing interval is "${analysis.billingInterval}" instead of "month"`)
      recommendations.push('Change billing interval to "Monthly" in Paddle Dashboard')
    }
    
    if (analysis.status !== 'active') {
      recommendations.push(`❌ Price status is "${analysis.status}" instead of "active"`)
      recommendations.push('Activate the price in Paddle Dashboard')
    }

    if (isProperlyConfigured) {
      recommendations.push('✅ Price is properly configured for recurring monthly billing')
      recommendations.push('✅ Webhook events should work correctly')
      recommendations.push('✅ Next billing date will be calculated automatically')
    }

    return NextResponse.json({
      analysis,
      isProperlyConfigured,
      recommendations,
      nextSteps: isProperlyConfigured ? [
        'Test checkout flow to ensure recurring billing works',
        'Verify webhook events are received',
        'Check that next billing date is calculated correctly'
      ] : [
        'Fix the price configuration in Paddle Dashboard',
        'Update environment variables if needed',
        'Test again after configuration changes'
      ]
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to test recurring billing configuration',
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID,
      possibleCauses: [
        'Invalid price ID',
        'Price not found in Paddle account',
        'Insufficient API permissions',
        'Network connectivity issues'
      ]
    }, { status: 500 })
  }
}
