'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
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
  const hasInitialized = useRef(false)

  const totalSteps = 3

  // Check if user needs onboarding
  useEffect(() => {
    if (!user || hasInitialized.current) return

    // Check if user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`)
    
    if (hasCompletedOnboarding) {
      setIsCompleted(true)
      setIsOnboarding(false)
    } else {
      // For new users, show onboarding immediately
      setIsOnboarding(true)
      setCurrentStep(1)
    }
    
    hasInitialized.current = true
  }, [user])



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
    hasInitialized.current = false
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
