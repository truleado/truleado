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
  const [user, setUser] = useState<UserWithSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://dummy.supabase.co' || 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy_anon_key') {
      console.log('Using mock subscription context due to dummy environment variables')
      setIsLoading(false)
      setAccessLevel('trial') // Give trial access for dummy env vars
      return // Exit early to prevent further processing
    }
  }, [])

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
