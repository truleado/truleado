'use client'

import React from 'react'
import { useSubscription } from '@/lib/subscription-context'
import { X, Clock, AlertTriangle } from 'lucide-react'

export function TrialBanner() {
  const { user, trialTimeRemaining, showUpgradePrompt, accessLevel } = useSubscription()
  const [isVisible, setIsVisible] = React.useState(true)

  if (!isVisible || !showUpgradePrompt) {
    return null
  }

  const isExpired = accessLevel === 'limited' && user?.subscription_status === 'expired'
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
                ? 'Your trial has expired. Upgrade to continue using all features.'
                : `Your trial ends in ${trialTimeRemaining}. Upgrade now to avoid interruption.`
              }
            </p>
          </div>
          <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => window.location.href = '/upgrade'}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
                isExpired 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Upgrade Now
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
