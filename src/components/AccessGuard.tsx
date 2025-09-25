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
  const { canAccess, accessLevel } = useSubscription()

  if (canAccess(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
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
