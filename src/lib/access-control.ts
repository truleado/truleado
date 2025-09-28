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
  
  // Active subscription
  if (user.subscription_status === 'active' && isSubscriptionActive(user)) {
    return 'full'
  }
  
  // Trial period
  if (user.subscription_status === 'trial' && !isTrialExpired(user)) {
    return 'full'
  }
  
  // Expired trial or cancelled subscription
  if (user.subscription_status === 'expired' || user.subscription_status === 'cancelled') {
    return 'none'
  }
  
  // Past due subscription
  if (user.subscription_status === 'past_due') {
    return 'limited'
  }
  
  return 'limited'
}

export const canAccessFeature = (user: UserWithSubscription, feature: string, currentProductCount?: number): boolean => {
  const accessLevel = getAccessLevel(user)
  
  // Always accessible features
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
  
  // Full access features
  const fullAccessFeatures = [
    'edit_products',
    'delete_products',
    'delete_leads',
    'start_lead_discovery',
    'stop_lead_discovery',
    'view_analytics',
    'export_data'
  ]
  
  if (fullAccessFeatures.includes(feature)) {
    return accessLevel === 'full'
  }
  
  // Special handling for add_products based on trial status
  if (feature === 'add_products') {
    // If user has active subscription, allow unlimited products
    if (user.subscription_status === 'active' && isSubscriptionActive(user)) {
      return true
    }
    
    // If user is on trial, check product count
    if (user.subscription_status === 'trial' && !isTrialExpired(user)) {
      return (currentProductCount || 0) < 1
    }
    
    // For expired/cancelled users, no access
    return false
  }
  
  // Limited access features (view-only)
  const limitedAccessFeatures = [
    'view_products',
    'view_leads',
    'view_activity'
  ]
  
  if (limitedAccessFeatures.includes(feature)) {
    return accessLevel === 'full' || accessLevel === 'limited'
  }

  // 24-hour trial features (same as add_products logic)
  const trialFeatures = [
    'promote_products'
  ]
  
  if (trialFeatures.includes(feature)) {
    // If user has active subscription, allow unlimited access
    if (user.subscription_status === 'active' && isSubscriptionActive(user)) {
      return true
    }
    
    // If user is on trial, check if trial is not expired
    if (user.subscription_status === 'trial' && !isTrialExpired(user)) {
      return true
    }
    
    // For expired/cancelled users, no access
    return false
  }
  
  return false
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
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`
  } else {
    return `${seconds}s remaining`
  }
}

export const shouldShowUpgradePrompt = (user: UserWithSubscription): boolean => {
  if (!user) return false
  
  const accessLevel = getAccessLevel(user)
  const timeRemaining = getTrialTimeRemaining(user)
  
  // Show upgrade prompt if trial is expiring soon (less than 2 hours) or expired
  return accessLevel === 'limited' || timeRemaining < 2 * 60 * 60 * 1000
}
