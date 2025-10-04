'use client'

import React from 'react'
import { useSubscription } from '@/lib/subscription-context'
import { Lock, AlertTriangle } from 'lucide-react'

interface AccessGuardProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AccessGuard({ feature, children, fallback }: AccessGuardProps) {
  const { canAccess, accessLevel, user, isLoading } = useSubscription()

  // Only log debug info for important features to reduce console spam
  if (feature === 'view_products' || feature === 'add_products') {
    console.log('AccessGuard debug:', {
      feature,
      canAccess: canAccess(feature),
      accessLevel,
      isLoading,
      user: user ? { 
        id: user.id, 
        subscription_status: user.subscription_status, 
        trial_ends_at: user.trial_ends_at,
        subscription_ends_at: user.subscription_ends_at
      } : null
    })
  }

  // Show loading state while subscription is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If we have a user and they can access the feature, show the content
  if (user && canAccess(feature)) {
    return <>{children}</>
  }

  // If we have a user but they can't access the feature, show fallback
  if (user && !canAccess(feature)) {
    if (fallback) {
      return <>{fallback}</>
    }
  }

  // If no user, don't show anything (let auth redirect handle it)
  if (!user) {
    return null
  }

  const handleUpgradeClick = () => {
    window.location.href = '/settings?tab=billing'
  }

  return (
    <>
      <div className="text-center py-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Lock className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Feature Restricted</h3>
        <p className="mt-1 text-sm text-gray-500">
          {accessLevel === 'limited' 
            ? 'Your trial has expired. Upgrade to continue using this feature.'
            : 'You need an active subscription to access this feature.'
          }
        </p>
        <div className="mt-6">
          <button
            onClick={handleUpgradeClick}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </>
  )
}

export function UpgradeButton({ feature, children, className = '' }: { 
  feature: string
  children: React.ReactNode
  className?: string 
}) {
  const { canAccess } = useSubscription()

  if (canAccess(feature)) {
    return <>{children}</>
  }

  return (
    <button
      onClick={() => window.location.href = '/settings?tab=billing'}
      className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 ${className}`}
    >
      <Lock className="h-4 w-4 mr-2" />
      Upgrade Required
    </button>
  )
}
