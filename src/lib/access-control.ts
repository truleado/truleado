import { User } from '@supabase/supabase-js'

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'past_due'
export type AccessLevel = 'full' | 'limited' | 'none'

export interface UserWithSubscription extends User {
  subscription_status?: SubscriptionStatus
  trial_ends_at?: string
  subscription_ends_at?: string
  trial_count?: number
  last_trial_at?: string
}

export const isTrialExpired = (user: UserWithSubscription): boolean => {
  if (!user.trial_ends_at) return false
  const now = new Date()
  const trialEndsAt = new Date(user.trial_ends_at)
  return now > trialEndsAt
}

export const isSubscriptionActive = (user: UserWithSubscription): boolean => {
  if (!user.subscription_ends_at) return false
  const now = new Date()
  const subscriptionEndsAt = new Date(user.subscription_ends_at)
  return now < subscriptionEndsAt
}

export const getAccessLevel = (user: UserWithSubscription): AccessLevel => {
  if (!user) return 'none'
  
  // Active subscription - give full access regardless of subscription_ends_at
  if (user.subscription_status === 'active') {
    return 'full'
  }
  
  // 7-day trial period - give full access to all features
  if (user.subscription_status === 'trial' && !isTrialExpired(user)) {
    return 'full'
  }
  
  // Expired trial or cancelled subscription - no access
  if (user.subscription_status === 'expired' || user.subscription_status === 'cancelled') {
    return 'none'
  }
  
  // Past due subscription - limited access
  if (user.subscription_status === 'past_due') {
    return 'limited'
  }
  
  // Default to no access for new users (they need to start trial)
  return 'none'
}

export const canAccessFeature = (user: UserWithSubscription, feature: string, currentProductCount?: number): boolean => {
  const accessLevel = getAccessLevel(user)
  
  // Always accessible features (even without trial/subscription)
  const alwaysAccessible = [
    'view_dashboard',
    'view_settings',
    'manage_billing',
    'view_profile',
    'update_profile'
  ]
  
  if (alwaysAccessible.includes(feature)) {
    return true
  }
  
  // All other features require full access (trial or subscription)
  return accessLevel === 'full'
}

export const getTrialTimeRemaining = (user: UserWithSubscription): number => {
  if (!user || !user.trial_ends_at) return 0
  const now = new Date()
  const trialEndsAt = new Date(user.trial_ends_at)
  const diff = trialEndsAt.getTime() - now.getTime()
  return Math.max(0, diff)
}

export const formatTrialTimeRemaining = (user: UserWithSubscription): string => {
  if (!user) return 'Loading...'
  
  const timeRemaining = getTrialTimeRemaining(user)
  
  if (timeRemaining === 0) {
    return 'Trial expired'
  }
  
  // Calculate days remaining (round up to avoid showing 0 days when there's time left)
  const days = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
  
  if (days <= 0) {
    return 'Trial expired'
  } else if (days === 1) {
    return '1 day remaining'
  } else {
    return `${days} days remaining`
  }
}

export const shouldShowUpgradePrompt = (user: UserWithSubscription): boolean => {
  if (!user) return false
  
  // Never show upgrade prompt to users with active subscriptions
  if (user.subscription_status === 'active') {
    return false
  }
  
  // Don't show upgrade prompt to users who haven't started a trial yet
  if (!user.subscription_status || user.subscription_status === 'trial') {
    return false
  }
  
  const accessLevel = getAccessLevel(user)
  const timeRemaining = getTrialTimeRemaining(user)
  
  // Show upgrade prompt only if:
  // 1. Trial has expired (no access) AND user has actually had a trial
  // 2. Trial is expiring soon (less than 24 hours remaining)
  return accessLevel === 'none' || timeRemaining < 24 * 60 * 60 * 1000
}

// New function to check if user needs to start trial
export const needsTrialStart = (user: UserWithSubscription): boolean => {
  if (!user) return true
  
  // Never show trial start modal to users with active subscriptions
  if (user.subscription_status === 'active') {
    return false
  }
  
  // User needs to start trial if they have no subscription status or expired trial
  return !user.subscription_status || user.subscription_status === 'expired'
}
