'use client'

import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/lib/subscription-context'
import LoadingSpinner from './LoadingSpinner'

interface AppLoadingProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AppLoading({ children, fallback }: AppLoadingProps) {
  const { loading: authLoading } = useAuth()
  const { isLoading: subscriptionLoading } = useSubscription()

  // Show loading if either auth or subscription is loading
  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  // Show fallback if provided and no loading
  if (fallback) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
