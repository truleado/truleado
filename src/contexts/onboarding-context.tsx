'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/lib/subscription-context'

interface OnboardingContextType {
  isOnboarding: boolean
  currentStep: number
  totalSteps: number
  isCompleted: boolean
  nextStep: () => void
  prevStep: () => void
  completeOnboarding: () => void
  skipOnboarding: () => void
  startOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { canAccess } = useSubscription()
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isCompleted, setIsCompleted] = useState(false)

  const totalSteps = 4

  // Check if user needs onboarding
  useEffect(() => {
    if (!user) return

    // Check if user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`)
    
    if (hasCompletedOnboarding) {
      setIsCompleted(true)
      setIsOnboarding(false)
      return
    }

    // Check if user has products and Reddit connected
    checkOnboardingStatus()
  }, [user])

  // Check URL parameters for onboarding triggers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab')
      
      if (tab === 'integrations') {
        // User was directed here from onboarding, check if they completed the step
        setTimeout(() => {
          checkOnboardingStatus()
        }, 1000)
      }
    }
  }, [])

  const checkOnboardingStatus = async () => {
    if (!user) return

    try {
      // Check if user has products
      const productsResponse = await fetch('/api/products', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const productsData = await productsResponse.json()
      const hasProducts = productsData?.products?.length > 0

      // Check Reddit connection
      const redditResponse = await fetch('/api/auth/reddit/status', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const redditData = await redditResponse.json()
      const hasReddit = redditData?.connected

      // If user already has both, complete onboarding
      if (hasProducts && hasReddit) {
        completeOnboarding()
      } else if (!isOnboarding) {
        // Only start onboarding if not already in progress
        setIsOnboarding(true)
        setCurrentStep(1)
      }
      // If already onboarding, don't reset the current step
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      // Only start onboarding as fallback if not already in progress
      if (!isOnboarding) {
        setIsOnboarding(true)
        setCurrentStep(1)
      }
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true')
    }
    setIsCompleted(true)
    setIsOnboarding(false)
  }

  const skipOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true')
    }
    setIsCompleted(true)
    setIsOnboarding(false)
  }

  const startOnboarding = () => {
    setIsOnboarding(true)
    setCurrentStep(1)
    setIsCompleted(false)
  }

  const value: OnboardingContextType = {
    isOnboarding,
    currentStep,
    totalSteps,
    isCompleted,
    nextStep,
    prevStep,
    completeOnboarding,
    skipOnboarding,
    startOnboarding
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
