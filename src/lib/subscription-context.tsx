'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { UserWithSubscription, getAccessLevel, canAccessFeature, formatTrialTimeRemaining, shouldShowUpgradePrompt } from '@/lib/access-control'

interface SubscriptionContextType {
  user: UserWithSubscription | null
  subscriptionStatus: string
  accessLevel: 'full' | 'limited' | 'none'
  trialTimeRemaining: string
  showUpgradePrompt: boolean
  isLoading: boolean
  refreshSubscription: () => Promise<void>
  canAccess: (feature: string, currentProductCount?: number) => boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, loading: authLoading } = useAuth()
  
  // Check for dummy environment variables immediately
  const isDummyEnv = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://dummy.supabase.co' || 
                     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy_anon_key'

  // Initialize with mock user if it's a dummy environment
  const [user, setUser] = useState<UserWithSubscription | null>(() => {
    if (isDummyEnv) {
      return {
        id: 'mock-user-id',
        email: 'demo@truleado.com',
        subscription_status: 'expired',
        trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago (expired)
        trial_count: 1,
        last_trial_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      } as UserWithSubscription
    }
    return null
  })
  
  const [isLoading, setIsLoading] = useState(() => !isDummyEnv)

  const accessLevel = user ? getAccessLevel(user) : 'none'
  const trialTimeRemaining = user ? formatTrialTimeRemaining(user) : ''
  const showUpgradePrompt = user ? shouldShowUpgradePrompt(user) : false

  const canAccess = (feature: string, currentProductCount?: number) => user ? canAccessFeature(user, feature, currentProductCount) : false

  const refreshSubscription = async () => {
    if (!authUser) return

    try {
      const response = await fetch('/api/billing/status')
      if (response.ok) {
        const data = await response.json()
        setUser({ ...authUser, ...data })
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error)
    }
  }

  useEffect(() => {
    if (!authLoading && authUser) {
      refreshSubscription()
    } else if (!authLoading && !authUser) {
      setUser(null)
      setIsLoading(false)
    }
  }, [authUser, authLoading])

  useEffect(() => {
    try {
      if (!authLoading) {
        // If auth is not loading, we're done loading regardless of user state
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Subscription context error:', error)
      setIsLoading(false)
    }
  }, [authLoading])

  // Handle dummy environment variables - set loading to false immediately
  useEffect(() => {
    if (isDummyEnv) {
      console.log('Using mock subscription context due to dummy environment variables')
      setIsLoading(false)
      // Create a mock user with EXPIRED trial status for dummy env vars (for testing)
      const mockUser = {
        id: 'mock-user-id',
        email: 'demo@truleado.com',
        subscription_status: 'expired',
        trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago (expired)
        trial_count: 1,
        last_trial_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      } as UserWithSubscription
      console.log('Setting mock user with expired trial:', mockUser)
      setUser(mockUser)
      return // Exit early to prevent further processing
    }
  }, [isDummyEnv])

  const value: SubscriptionContextType = {
    user,
    subscriptionStatus: user?.subscription_status || 'trial',
    accessLevel,
    trialTimeRemaining,
    showUpgradePrompt,
    isLoading,
    refreshSubscription,
    canAccess
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
