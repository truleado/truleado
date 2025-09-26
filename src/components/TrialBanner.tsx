'use client'

import React, { useEffect } from 'react'
import { useSubscription } from '@/lib/subscription-context'
import { X, Clock, AlertTriangle } from 'lucide-react'

export function TrialBanner() {
  const { user, trialTimeRemaining, showUpgradePrompt, accessLevel } = useSubscription()
  const [isVisible, setIsVisible] = React.useState(true)
  const [isUpgrading, setIsUpgrading] = React.useState(false)

  // Auto-hide banner if user has active subscription
  useEffect(() => {
    if (user?.subscription_status === 'active') {
      setIsVisible(false)
    }
  }, [user?.subscription_status])

  // Auto-hide banner if payment success flag is set
  useEffect(() => {
    const checkPaymentSuccess = () => {
      try {
        if (typeof window !== 'undefined' && localStorage.getItem('payment_success') === 'true') {
          setIsVisible(false)
          localStorage.removeItem('payment_success')
        }
      } catch {}
    }
    checkPaymentSuccess()
    const interval = setInterval(checkPaymentSuccess, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!isVisible || !showUpgradePrompt) {
    return null
  }

  const isExpired = trialTimeRemaining === 'Trial expired'
  const isExpiringSoon = trialTimeRemaining.includes('m remaining') && !trialTimeRemaining.includes('h')

  return (
    <div className={`relative ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} border-l-4 p-3 sm:p-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isExpired ? (
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
          ) : (
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          )}
        </div>
        <div className="ml-2 sm:ml-3 flex-1">
          <h3 className={`text-xs sm:text-sm font-medium ${isExpired ? 'text-red-800' : 'text-blue-800'}`}>
            {isExpired ? 'Trial Expired' : 'Free Trial Active'}
          </h3>
          <div className={`mt-1 text-xs sm:text-sm ${isExpired ? 'text-red-700' : 'text-blue-700'}`}>
            <p>
              {isExpired 
                ? 'Your trial is expired. Upgrade now to avoid interruption.'
                : `Your trial ends in ${trialTimeRemaining}. Upgrade now to avoid interruption.`
              }
            </p>
          </div>
          <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={async () => {
                if (isUpgrading) return
                setIsUpgrading(true)
                try {
                  // Try client-side Paddle checkout first
                  const pubRes = await fetch('/api/billing/public-config')
                  const pub = await pubRes.json()
                  if (pub?.clientToken && pub?.priceId) {
                    const { initializePaddle } = await import('@paddle/paddle-js')
                    const paddle = await initializePaddle({
                      environment: pub.environment === 'production' ? 'production' : 'sandbox',
                      token: pub.clientToken,
                      eventCallback: async (event: any) => {
                        try {
                          if (event?.name === 'checkout.completed') {
                            // Mark success and refresh subscription immediately
                            try { localStorage.setItem('payment_success', 'true') } catch {}
                            await fetch('/api/debug/manual-subscription-update', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user?.id, subscriptionStatus: 'active' })
                            })
                            // Hide banner immediately
                            setIsVisible(false)
                          }
                        } catch (e) {
                          console.error('Checkout event handling failed', e)
                        }
                      }
                    })
                    if (!paddle || !paddle.Checkout) {
                      throw new Error('Paddle initialization failed')
                    }
                    await paddle.Checkout.open({
                      items: [{ priceId: pub.priceId, quantity: 1 }],
                      settings: { displayMode: 'overlay' },
                      customer: user?.email ? { email: user.email } : undefined,
                      customData: user ? { user_id: user.id, user_email: user.email } : undefined
                    })
                  } else {
                    // Fallback to settings page
                    window.location.href = '/settings?tab=billing'
                  }
                } catch (e) {
                  console.error('Upgrade failed:', e)
                  // Fallback to settings page
                  window.location.href = '/settings?tab=billing'
                } finally {
                  setIsUpgrading(false)
                }
              }}
              disabled={isUpgrading}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
                isExpired 
                  ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {isUpgrading ? 'Processing...' : 'Upgrade Now'}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
                isExpired 
                  ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              Dismiss
            </button>
          </div>
        </div>
        <div className="ml-auto pl-2">
          <button
            onClick={() => setIsVisible(false)}
            className={`inline-flex rounded-md p-1 ${
              isExpired 
                ? 'text-red-500 hover:bg-red-100' 
                : 'text-blue-500 hover:bg-blue-100'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
