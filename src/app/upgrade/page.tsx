'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/lib/subscription-context'
import AppLayout from '@/components/app-layout'
import PaddleCheckout from '@/components/PaddleCheckout'
import { Check, ArrowRight, Loader2, CreditCard, Clock, CheckCircle } from 'lucide-react'

export default function UpgradePage() {
  const { user } = useAuth()
  const { subscriptionStatus, trialTimeRemaining } = useSubscription()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.checkout_url
      } else {
        console.error('Failed to create checkout session')
        alert('Failed to create checkout session. Please try again.')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Error creating checkout session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isActive = subscriptionStatus === 'active'
  const isTrial = subscriptionStatus === 'trial'

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Upgrade to Pro</h1>
          <p className="text-gray-600 mt-2">
            Unlock unlimited features and find more customers on Reddit
          </p>
        </div>

        {/* Current Status */}
        {isTrial && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-blue-800">Free Trial Active</h3>
                <p className="text-blue-700">
                  {trialTimeRemaining} remaining. Upgrade now to continue after your trial ends.
                </p>
              </div>
            </div>
          </div>
        )}

        {isActive && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-green-800">Pro Plan Active</h3>
                <p className="text-green-700">
                  You have access to all premium features. Thank you for being a Pro user!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Free Trial Card */}
          <div className={`bg-white rounded-2xl shadow-lg border p-8 ${isTrial ? 'border-blue-200' : 'border-gray-200'}`}>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Free Trial</h3>
              <p className="mt-2 text-gray-600">Try everything for 1 day</p>
              
              <div className="mt-8">
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-xl text-gray-500 ml-1">for 1 day</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">No credit card required</p>
              </div>

              <div className="mt-8">
                {isTrial ? (
                  <div className="w-full bg-gray-100 text-gray-500 px-6 py-3 rounded-md text-sm font-semibold flex items-center justify-center">
                    <Check className="w-4 h-4 mr-2" />
                    Currently Active
                  </div>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-500 px-6 py-3 rounded-md text-sm font-semibold flex items-center justify-center">
                    Trial Ended
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">What's included:</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Full access to all features</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">1 product monitoring</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">All subreddits monitored</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">AI-powered lead analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">24/7 background monitoring</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pro Plan Card */}
          <div className={`bg-white rounded-2xl shadow-xl border-2 p-8 relative ${isActive ? 'border-green-200' : 'border-blue-200'}`}>
            {isActive ? (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">Current Plan</span>
              </div>
            ) : (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Pro Plan</h3>
              <p className="mt-2 text-gray-600">Everything you need to find quality leads</p>
              
              <div className="mt-8">
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">$30</span>
                  <span className="text-xl text-gray-500 ml-1">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">After 1-day free trial</p>
              </div>

              <div className="mt-8">
                {isActive ? (
                  <div className="w-full bg-green-100 text-green-700 px-6 py-3 rounded-md text-sm font-semibold flex items-center justify-center">
                    <Check className="w-4 h-4 mr-2" />
                    Active Subscription
                  </div>
                ) : (
                  <PaddleCheckout
                    priceId={process.env.NEXT_PUBLIC_PADDLE_PRICE_ID}
                    clientToken={process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN}
                    environment="sandbox"
                    customerEmail={user?.email}
                    customData={{
                      user_id: user?.id,
                      user_email: user?.email
                    }}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onSuccess={(data) => {
                      console.log('Checkout success:', data)
                      window.location.href = `/billing/success?session_id=${data.transactionId || data.id}`
                    }}
                    onError={(error) => {
                      console.error('Checkout error:', error)
                      alert(`Payment failed: ${error.message || 'Please try again.'}`)
                    }}
                  >
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  </PaddleCheckout>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">What's included:</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited product monitoring</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">All subreddits monitored</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">AI-powered lead analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">24/7 background monitoring</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Real-time lead notifications</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Full conversation context</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Export leads to CSV <span className="text-blue-600 font-medium">(Coming Soon)</span></span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">How does billing work?</h3>
              <p className="mt-2 text-gray-600">
                You start with a 1-day free trial. If you don't cancel, you'll be automatically charged $30/month. You can cancel anytime from your account settings.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Can I cancel anytime?</h3>
              <p className="mt-2 text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">What payment methods do you accept?</h3>
              <p className="mt-2 text-gray-600">
                We accept all major credit cards, PayPal, and other payment methods through our secure payment processor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

