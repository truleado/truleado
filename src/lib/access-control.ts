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
  
  // Active subscription - give full access
  if (user.subscription_status === 'active') {
    return 'full'
  }
  
  // Active trial (not expired) - give full access during trial period
  if (user.subscription_status === 'trial' && !isTrialExpired(user)) {
    return 'full'
  }
  
  // Past due subscription - limited access
  if (user.subscription_status === 'past_due') {
    return 'limited'
  }
  
  // All other statuses (expired trial, cancelled, or no subscription) - no access
  // Users must upgrade after trial expires
  return 'none'
}

export const canAccessFeature = (user: UserWithSubscription, feature: string, currentProductCount?: number): boolean => {
  const accessLevel = getAccessLevel(user)
  
  // Always accessible features (even without subscription) - only for billing/settings
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
  
  // All other features require active subscription OR active trial
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
  
  // Show upgrade prompt if trial is expired or user has no trial/subscription
  if (user.subscription_status === 'trial' && isTrialExpired(user)) {
    return true
  }
  
  // Show upgrade prompt for users without active subscription or expired trial
  if (user.subscription_status !== 'trial' || isTrialExpired(user)) {
    return true
  }
  
  return false
}

// Function to check if user needs to start trial
export const needsTrialStart = (user: UserWithSubscription): boolean => {
  if (!user) return true
  
  // If user has no subscription status or it's null/empty, they need a trial
  if (!user.subscription_status || user.subscription_status === 'free' || user.subscription_status === '') {
    return true
  }
  
  // If user has expired trial and no active subscription, they need to upgrade (not start trial)
  if (user.subscription_status === 'trial' && isTrialExpired(user)) {
    return false
  }
  
  // If user already has an active trial or subscription, they don't need to start trial
  return false
}
