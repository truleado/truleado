'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { UserWithSubscription, getAccessLevel, canAccessFeature, formatTrialTimeRemaining, shouldShowUpgradePrompt, needsTrialStart } from '@/lib/access-control'

interface SubscriptionContextType {
  user: UserWithSubscription | null
  subscriptionStatus: string
  accessLevel: 'full' | 'limited' | 'none'
  trialTimeRemaining: string
  showUpgradePrompt: boolean
  needsTrial: boolean
  isLoading: boolean
  refreshSubscription: () => Promise<void>
  canAccess: (feature: string, currentProductCount?: number) => boolean
  forceRefresh: () => Promise<void>
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
  const needsTrial = user ? needsTrialStart(user) : true

  // Debug logging for PRO users and new users (only log once per user change)
  useEffect(() => {
    if (user) {
      if (user.subscription_status === 'active') {
        console.log('PRO user detected:', {
          subscription_status: user.subscription_status,
          needsTrial,
          showUpgradePrompt,
          accessLevel
        })
      } else if (!user.subscription_status || user.subscription_status === 'trial') {
        console.log('New/Trial user detected:', {
          subscription_status: user.subscription_status,
          needsTrial,
          showUpgradePrompt,
          accessLevel
        })
      }
    }
  }, [user?.id, user?.subscription_status]) // Only log when user or subscription status changes

  const canAccess = (feature: string, currentProductCount?: number) => user ? canAccessFeature(user, feature, currentProductCount) : false

  const refreshSubscription = useCallback(async () => {
    if (!authUser) return

    try {
      // Only log the first refresh to reduce console spam
      if (!user) {
        console.log('Refreshing subscription for user:', authUser.id)
      }
      const response = await fetch('/api/billing/status', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        if (!user) {
          console.log('Subscription data received:', data)
        }
        setUser({ ...authUser, ...data })
        setIsLoading(false) // Ensure loading is set to false after successful fetch
      } else {
        console.error('Failed to fetch subscription status:', response.status, response.statusText)
        // For PRO users, maintain their subscription status even if API fails
        // For new users, they'll need to start a trial
        const fallbackUser = authUser as UserWithSubscription
        if (!fallbackUser.subscription_status) {
          // Only set trial status if user has no subscription status at all
          fallbackUser.subscription_status = 'trial'
          fallbackUser.trial_ends_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
        setUser(fallbackUser)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error)
      // For PRO users, maintain their subscription status even if API fails
      // For new users, they'll need to start a trial
      const fallbackUser = authUser as UserWithSubscription
      if (!fallbackUser.subscription_status) {
        // Only set trial status if user has no subscription status at all
        fallbackUser.subscription_status = 'trial'
        fallbackUser.trial_ends_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
      setUser(fallbackUser)
      setIsLoading(false)
    }
  }, [authUser])

  const forceRefresh = async () => {
    console.log('Force refreshing subscription...')
    setIsLoading(true)
    await refreshSubscription()
    setIsLoading(false)
  }

  useEffect(() => {
    if (!authLoading && authUser) {
      refreshSubscription()
    } else if (!authLoading && !authUser) {
      setUser(null)
      setIsLoading(false)
    } else if (authLoading) {
      // Keep loading state while auth is loading
      setIsLoading(true)
    }
  }, [authUser, authLoading, refreshSubscription])

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

  // Handle production users - fetch subscription status
  useEffect(() => {
    if (!isDummyEnv && !authLoading && authUser) {
      console.log('Production environment - fetching subscription for user:', authUser.id)
      refreshSubscription()
    } else if (!isDummyEnv && !authLoading && !authUser) {
      // No authenticated user, set loading to false
      setUser(null)
      setIsLoading(false)
    }
  }, [isDummyEnv, authLoading, authUser])

  // Add a less frequent refresh for production users to ensure subscription status is up to date
  useEffect(() => {
    if (!isDummyEnv && authUser && !authLoading) {
      const interval = setInterval(() => {
        console.log('Periodic subscription refresh for user:', authUser.id)
        refreshSubscription()
      }, 600000) // Refresh every 10 minutes to reduce console spam

      return () => clearInterval(interval)
    }
  }, [isDummyEnv, authUser, authLoading])

  const value: SubscriptionContextType = {
    user,
    subscriptionStatus: user?.subscription_status || 'trial',
    accessLevel,
    trialTimeRemaining,
    showUpgradePrompt,
    needsTrial,
    isLoading,
    refreshSubscription,
    canAccess,
    forceRefresh
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
