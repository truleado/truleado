'use client'

import React from 'react'
import { useSubscription } from '@/lib/subscription-context'
import { X, Check, Star, Zap } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature?: string
}

export function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  const { user, trialTimeRemaining } = useSubscription()

  if (!isOpen) return null

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.checkout_url
      } else {
        console.error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Upgrade to Continue
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {feature 
                    ? `You need an active subscription to ${feature}.`
                    : 'Your trial has expired. Upgrade to continue using all features.'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">What you get with Truleado Pro:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Unlimited lead discovery
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  AI-powered lead analysis
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Advanced filtering and search
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Export and analytics
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Priority support
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">$30</div>
              <div className="text-sm text-gray-500">per month</div>
              {trialTimeRemaining !== 'Trial expired' && (
                <div className="mt-2 text-xs text-gray-400">
                  Trial ends in {trialTimeRemaining}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              onClick={handleUpgrade}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
            >
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Now
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
