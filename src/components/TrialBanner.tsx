'use client'

import React, { useEffect } from 'react'
import { useSubscription } from '@/lib/subscription-context'
import { Clock } from 'lucide-react'

export function TrialBanner() {
  const { user, trialTimeRemaining, showUpgradePrompt, refreshSubscription } = useSubscription()
  const [isUpgrading, setIsUpgrading] = React.useState(false)
  const [currentTrialTime, setCurrentTrialTime] = React.useState(trialTimeRemaining)

  // Update current trial time when trialTimeRemaining changes
  useEffect(() => {
    setCurrentTrialTime(trialTimeRemaining)
  }, [trialTimeRemaining])

  // Refresh subscription periodically to update countdown (every 30 seconds)
  useEffect(() => {
    if (user?.subscription_status === 'trial') {
      const interval = setInterval(() => {
        refreshSubscription()
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [user?.subscription_status, refreshSubscription])

  // Poll for subscription update after payment (check every 2 seconds for 30 seconds)
  useEffect(() => {
    if (isUpgrading && user?.subscription_status === 'trial') {
      let pollCount = 0
      const maxPolls = 15 // 15 polls * 2 seconds = 30 seconds
      
      const checkInterval = setInterval(async () => {
        pollCount++
        await refreshSubscription()
        
        // Check subscription status after refresh
        // We'll check via the subscription context which will update
        if (pollCount >= maxPolls) {
          clearInterval(checkInterval)
          setIsUpgrading(false)
        }
      }, 2000)

      return () => {
        clearInterval(checkInterval)
      }
    } else if (isUpgrading && user?.subscription_status === 'active') {
      // User has active subscription, stop upgrading state
      setIsUpgrading(false)
    }
  }, [isUpgrading, user?.subscription_status, refreshSubscription])

  // Show banner for trial users (permanent until trial expires or user upgrades)
  const isTrialUser = user?.subscription_status === 'trial'
  const isTrialExpired = currentTrialTime === 'Trial expired' || currentTrialTime === 'Loading...'
  
  // Don't show if user has active subscription
  if (user?.subscription_status === 'active') {
    return null
  }
  
  // Always show for trial users or users who need to upgrade
  if (!isTrialUser && !showUpgradePrompt) {
    return null
  }

  return (
    <div className="relative bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 border-l-4 p-3 sm:p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
        </div>
        <div className="ml-2 sm:ml-3 flex-1">
          <h3 className="text-xs sm:text-sm font-medium text-orange-900">
            {isTrialExpired ? 'Your Free Trial Has Ended' : '7 Days Free Trial'}
          </h3>
          <div className="mt-1 text-xs sm:text-sm text-orange-800">
            {isTrialExpired ? (
              <p>Upgrade now to continue using all Truleado features.</p>
            ) : (
              <p>
                You have <span className="font-semibold">{currentTrialTime}</span> left in your free trial. 
                Upgrade anytime to keep your access.
              </p>
            )}
          </div>
          <div className="mt-3">
            <button
              onClick={async () => {
                if (isUpgrading) return
                setIsUpgrading(true)
                try {
                  // Fetch Paddle configuration
                  const pubRes = await fetch('/api/billing/public-config', {
                    credentials: 'include'
                  })
                  const pub = await pubRes.json()
                  
                  if (pub?.clientToken && pub?.priceId) {
                    const { initializePaddle } = await import('@paddle/paddle-js')
                    const paddle = await initializePaddle({
                      environment: pub.environment === 'production' ? 'production' : 'sandbox',
                      token: pub.clientToken,
                      eventCallback: async (event: any) => {
                        try {
                          console.log('Paddle event received:', event)
                          
                          // Handle checkout completion
                          if (event?.name === 'checkout.completed' || event?.event === 'checkout.completed') {
                            console.log('Checkout completed, waiting for webhook to update subscription...')
                            // Keep isUpgrading true - the polling effect will detect when subscription becomes active
                            // Don't set isUpgrading to false here - let the polling effect handle it
                          }
                        } catch (e) {
                          console.error('Checkout event handling failed', e)
                        }
                      }
                    })
                    
                    if (!paddle || !paddle.Checkout) {
                      throw new Error('Paddle initialization failed')
                    }
                    
                    // Open Paddle checkout overlay
                    await paddle.Checkout.open({
                      items: [{ priceId: pub.priceId, quantity: 1 }],
                      settings: { 
                        displayMode: 'overlay',
                        theme: 'light',
                        locale: 'en'
                      },
                      customer: user?.email ? { email: user.email } : undefined,
                      customData: user ? { 
                        user_id: user.id, 
                        user_email: user.email 
                      } : undefined
                    })
                    
                    // Don't set isUpgrading to false here - let the polling effect handle it
                    // The checkout overlay is now open, and when payment completes,
                    // the webhook will update the subscription, and polling will detect it
                  } else {
                    // Fallback to settings page if Paddle config is missing
                    console.error('Paddle configuration missing:', pub)
                    setIsUpgrading(false)
                    window.location.href = '/settings?tab=billing'
                  }
                } catch (e) {
                  console.error('Upgrade failed:', e)
                  setIsUpgrading(false)
                  // Fallback to settings page on error
                  window.location.href = '/settings?tab=billing'
                }
              }}
              disabled={isUpgrading}
              className="px-4 py-2 rounded-md text-xs sm:text-sm font-semibold bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {isUpgrading ? 'Opening...' : 'Upgrade Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
