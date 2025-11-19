'use client'

import { useState } from 'react'
import { X, CreditCard, AlertTriangle, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface PaymentRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  subscriptionStatus?: string
  trialTimeRemaining?: string
}

export function PaymentRequiredModal({ 
  isOpen, 
  onClose,
  subscriptionStatus,
  trialTimeRemaining = 'Trial expired'
}: PaymentRequiredModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuth()

  const handleUpdatePayment = async () => {
    setIsProcessing(true)
    try {
      // Redirect to Paddle customer portal or checkout
      // For now, redirect to settings where they can update payment
      window.location.href = '/settings?tab=billing&update_payment=true'
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('Failed to open payment page. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusMessage = () => {
    if (subscriptionStatus === 'past_due') {
      return {
        title: 'Payment Required',
        message: 'Your payment failed. Please update your payment method to continue using Truleado.',
        icon: AlertTriangle,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-100'
      }
    }
    
    if (subscriptionStatus === 'expired' || (subscriptionStatus === 'trial' && trialTimeRemaining === 'Trial expired')) {
      return {
        title: 'Trial Period Ended',
        message: 'Your 7-day free trial has ended. Subscribe now to continue using all Truleado features.',
        icon: Lock,
        iconColor: 'text-orange-600',
        bgColor: 'bg-orange-100'
      }
    }

    return {
      title: 'Payment Required',
      message: 'Please complete your payment to continue using Truleado.',
      icon: CreditCard,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  }

  const statusInfo = getStatusMessage()
  const StatusIcon = statusInfo.icon

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${statusInfo.bgColor} rounded-full flex items-center justify-center`}>
                <StatusIcon className={`w-6 h-6 ${statusInfo.iconColor}`} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {statusInfo.title}
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
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">
                {statusInfo.message}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Continue enjoying:</h4>
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleUpdatePayment}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>{isProcessing ? 'Processing...' : 'Update Payment Method'}</span>
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need help? <a href="/support" className="text-blue-600 hover:text-blue-800">Contact Support</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

