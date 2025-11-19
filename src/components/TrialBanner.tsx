'use client'

import React, { useEffect } from 'react'
import { useSubscription } from '@/lib/subscription-context'
import { Clock } from 'lucide-react'

export function TrialBanner() {
  const { user, trialTimeRemaining, showUpgradePrompt } = useSubscription()
  const [currentTrialTime, setCurrentTrialTime] = React.useState(trialTimeRemaining)

  // Update current trial time when trialTimeRemaining changes
  useEffect(() => {
    setCurrentTrialTime(trialTimeRemaining)
  }, [trialTimeRemaining])

  // Show banner for trial users (permanent until trial expires or user upgrades)
  const isTrialUser = user?.subscription_status === 'trial'
  const isTrialExpired = currentTrialTime === 'Trial expired' || currentTrialTime === 'Loading...'
  const hasActiveSubscription = user?.subscription_status === 'active'
  
  // Don't show if user has active subscription
  if (hasActiveSubscription) {
    return null
  }
  
  const shouldShowBanner = isTrialUser || showUpgradePrompt

  // Always show for trial users or users who need to upgrade
  if (!shouldShowBanner) {
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
            {isTrialExpired
              ? 'Your Free Trial Has Ended'
              : '7 Days Free Trial'}
          </h3>
          <div className="mt-1 text-xs sm:text-sm text-orange-800">
            {isTrialExpired ? (
              <p>Your trial period has ended.</p>
            ) : (
              <p>
                You have <span className="font-semibold">{currentTrialTime}</span> left in your free trial.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
