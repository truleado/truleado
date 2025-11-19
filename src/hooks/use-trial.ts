'use client'

import { useState } from 'react'
import { useSubscription } from '@/lib/subscription-context'

export function useTrial() {
  const { showUpgradePrompt, trialTimeRemaining } = useSubscription()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async () => {
    // Payment functionality removed
    setIsUpgrading(true)
    try {
      // Redirect to settings page
      window.location.href = '/settings'
    } catch (error) {
      console.error('Error handling upgrade:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  return {
    showUpgradePrompt,
    trialTimeRemaining,
    isUpgrading,
    handleUpgrade
  }
}
