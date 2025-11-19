'use client'

import { useState } from 'react'
import { X, Crown, Clock, CheckCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface UpgradeRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  trialTimeRemaining?: string
}

export function UpgradeRequiredModal({ 
  isOpen, 
  onClose, 
  trialTimeRemaining = 'Trial expired'
}: UpgradeRequiredModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { signOut } = useAuth()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      // signOut already redirects to homepage, but ensure redirect happens
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Even on error, redirect to homepage
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } finally {
      setIsLoggingOut(false)
    }
  }

  const isTrialExpired = trialTimeRemaining === 'Trial expired'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Subscription Required
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isTrialExpired ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                {isTrialExpired ? (
                  <Clock className="w-8 h-8 text-red-600" />
                ) : (
                  <Crown className="w-8 h-8 text-yellow-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isTrialExpired ? 'Your Free Trial Has Ended' : 'Upgrade to Continue'}
              </h3>
              <p className="text-gray-600">
                {isTrialExpired 
                  ? 'Your 7-day free trial has ended.'
                  : `Your free trial ends ${trialTimeRemaining}.`
                }
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Features:</h4>
              <div className="space-y-2">
                {[
                  'Unlimited Reddit lead discovery',
                  'AI-powered content generation',
                  'Advanced analytics & insights',
                  'Product management tools',
                  'Export & data management',
                  'Priority support'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            {!isTrialExpired && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Remind Me Later
              </button>
            )}
            {isTrialExpired && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
