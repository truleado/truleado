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
	const [trialTimeRemaining, setTrialTimeRemaining] = useState<string>('')

	const accessLevel = user ? getAccessLevel(user) : 'none'
	const showUpgradePrompt = user ? shouldShowUpgradePrompt(user) : false

  const canAccess = (feature: string, currentProductCount?: number) => user ? canAccessFeature(user, feature, currentProductCount) : false

  const refreshSubscription = async () => {
    if (!authUser) return

    try {
      const response = await fetch('/api/debug/subscription')
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
      if (user) {
        setIsLoading(false)
      } else if (!authLoading) {
        // If auth is not loading and there's no user, we're done loading
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Subscription context error:', error)
      setIsLoading(false)
    }
  }, [user, authLoading])

	// Live-update trial time remaining every minute
	useEffect(() => {
		// Initialize immediately on user change
		if (user) {
			setTrialTimeRemaining(formatTrialTimeRemaining(user))
		} else {
			setTrialTimeRemaining('')
		}

		const intervalId = setInterval(() => {
			if (user) {
				setTrialTimeRemaining(formatTrialTimeRemaining(user))
			}
		}, 60_000)

		return () => clearInterval(intervalId)
	}, [user])

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
