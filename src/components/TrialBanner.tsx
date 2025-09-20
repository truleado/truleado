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
    <div className={`relative ${isExpired ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border-l-4 p-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {isExpired ? (
            <AlertTriangle className="h-5 w-5 text-red-400" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-400" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${isExpired ? 'text-red-800' : 'text-yellow-800'}`}>
            {isExpired ? 'Trial Expired' : 'Trial Ending Soon'}
          </h3>
          <div className={`mt-2 text-sm ${isExpired ? 'text-red-700' : 'text-yellow-700'}`}>
            <p>
              {isExpired 
                ? 'Your trial has expired. Upgrade to continue using all features.'
                : `Your trial ends in ${trialTimeRemaining}. Upgrade now to avoid interruption.`
              }
            </p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <button
                onClick={() => window.location.href = '/upgrade'}
                className={`px-2 py-1.5 rounded-md text-sm font-medium ${
                  isExpired 
                    ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                Upgrade Now
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className={`ml-3 px-2 py-1.5 rounded-md text-sm font-medium ${
                  isExpired 
                    ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => setIsVisible(false)}
              className={`inline-flex rounded-md p-1.5 ${
                isExpired 
                  ? 'text-red-500 hover:bg-red-100' 
                  : 'text-yellow-500 hover:bg-yellow-100'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
