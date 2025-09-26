'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import AppLayout from '@/components/app-layout'
import { useSubscription } from '@/lib/subscription-context'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  CreditCard, 
  Save,
  Eye,
  EyeOff,
  Link,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  RefreshCw,
  Download,
  Shield,
  Zap
} from 'lucide-react'

function SettingsContent() {
  const { user, loading } = useAuth()
  const { accessLevel, trialTimeRemaining, showUpgradePrompt, refreshSubscription } = useSubscription()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [redditConnected, setRedditConnected] = useState(false)
  const [redditUsername, setRedditUsername] = useState('')
  const [isConnectingReddit, setIsConnectingReddit] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState('')
  const [billingInfo, setBillingInfo] = useState({
    nextBillingDate: '',
    amount: '',
    paymentMethod: '',
    invoiceHistory: []
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isPollingUpgrade, setIsPollingUpgrade] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      newLeads: true,
      weeklyReport: true,
    },
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email || '' }))
      checkRedditConnection()
      fetchSubscriptionStatus()
    }
  }, [user, loading, router])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/debug/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus(data.subscription_status || 'free')
        
        // Fetch billing info if user has active subscription
        if (data.subscription_status === 'active') {
          await fetchBillingInfo()
        }
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error)
    }
  }

  const fetchBillingInfo = async () => {
    try {
      const response = await fetch('/api/billing/status')
      if (response.ok) {
        const data = await response.json()
        setBillingInfo({
          nextBillingDate: data.next_billing_date || '',
          amount: data.amount || '$30',
          paymentMethod: data.payment_method || 'Card ending in ****',
          invoiceHistory: data.invoices || []
        })
      }
    } catch (error) {
      console.error('Error fetching billing info:', error)
    }
  }

  const handleRefreshBilling = async () => {
    setIsRefreshing(true)
    try {
      await fetchSubscriptionStatus()
      await fetchBillingInfo()
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Check for tab parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab && ['profile', 'account', 'notifications', 'billing'].includes(tab)) {
      setActiveTab(tab)
    }
    
    // Check for success/error parameters from OAuth redirect
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const paymentSuccess = urlParams.get('payment_success') || (typeof window !== 'undefined' ? localStorage.getItem('payment_success') : null)
    
    if (success === 'reddit_connected') {
      // Refresh Reddit connection status after successful OAuth
      checkRedditConnection()
      setShowSuccessMessage(true)
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }

    // If returned from billing success, refresh and clean URL
    if (paymentSuccess === 'true') {
      ;(async () => {
        try {
          await fetchSubscriptionStatus()
          await fetchBillingInfo()
        } finally {
          const url = new URL(window.location.href)
          url.searchParams.delete('payment_success')
          window.history.replaceState({}, '', url.toString())
          try { localStorage.removeItem('payment_success') } catch {}
        }
      })()
    }
  }, [])

  // Handle payment success parameter
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success')
    const sessionId = searchParams.get('session_id')
    
    if (paymentSuccess === 'true' && user && sessionId) {
      // Check payment status and update subscription
      const checkPaymentStatus = async () => {
        try {
          console.log('Payment success detected, updating subscription directly for user:', user.id)
          
          // Directly update subscription status without API verification
          const updateResponse = await fetch('/api/debug/manual-subscription-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              subscriptionStatus: 'active'
            })
          })
          
          if (updateResponse.ok) {
            const result = await updateResponse.json()
            console.log('Subscription updated successfully:', result)
            
            // Refresh subscription status after successful update
            await refreshSubscription()
          } else {
            console.error('Failed to update subscription')
          }
        } catch (error) {
          console.error('Error updating subscription:', error)
        }
      }
      
      checkPaymentStatus()
      
      // Remove the parameters from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('payment_success')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, user, refreshSubscription])

  const checkRedditConnection = async () => {
    try {
      const response = await fetch('/api/auth/reddit/status')
      if (response.ok) {
        const data = await response.json()
        setRedditConnected(data.connected)
        setRedditUsername(data.username || '')
      }
    } catch (error) {
      console.error('Failed to check Reddit connection:', error)
    }
  }

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    try {
      const startUpgradePolling = () => {
        if (isPollingUpgrade) return
        setIsPollingUpgrade(true)
        const startedAt = Date.now()
        const poll = async () => {
          try {
            const res = await fetch('/api/debug/subscription')
            if (res.ok) {
              const data = await res.json()
              if (data.subscription_status === 'active') {
                setSubscriptionStatus('active')
                await fetchBillingInfo()
                setIsPollingUpgrade(false)
                return
              }
            }
          } catch {}
          if (Date.now() - startedAt < 3 * 60 * 1000) {
            setTimeout(poll, 5000)
          } else {
            setIsPollingUpgrade(false)
          }
        }
        setTimeout(poll, 5000)
      }

      // Try client-side Paddle first (works even if server API key is misconfigured)
      let clientTried = false
      try {
        const pubRes = await fetch('/api/billing/public-config')
        const pub = await pubRes.json()
        if (pub?.clientToken && pub?.priceId) {
          clientTried = true
          const { initializePaddle } = await import('@paddle/paddle-js')
          const paddle = await initializePaddle({
            environment: pub.environment === 'production' ? 'production' : 'sandbox',
            token: pub.clientToken,
            eventCallback: async (event: any) => {
              try {
                if (event?.name === 'checkout.completed') {
                  // Mark success and refresh subscription immediately
                  try { localStorage.setItem('payment_success', 'true') } catch {}
                  await fetch('/api/debug/manual-subscription-update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user?.id, subscriptionStatus: 'active' })
                  })
                  await refreshSubscription()
                  // Bring user to Billing tab updated
                  window.location.href = '/settings?tab=billing&payment_success=true'
                }
              } catch (e) {
                console.error('Checkout event handling failed', e)
              }
            }
          })
          if (!paddle || !paddle.Checkout) {
            throw new Error('Paddle initialization failed')
          }
          // Start polling in background while overlay is open
          startUpgradePolling()
          await paddle.Checkout.open({
            items: [{ priceId: pub.priceId, quantity: 1 }],
            settings: { displayMode: 'overlay' },
            customer: user?.email ? { email: user.email } : undefined,
            customData: user ? { user_id: user.id, user_email: user.email } : undefined
          })
          // If user closes overlay without paying, fall back to server flow below
        }
      } catch (e) {
        console.error('Client Paddle checkout attempt failed:', e)
      }

      // If client-side wasn't attempted or didn’t open, use server-side session
      if (!clientTried) {
        const response = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        if (response.ok) {
          const data = await response.json()
          window.location.href = data.checkout_url
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Failed to create checkout session:', errorData.error)
          alert('Billing is temporarily unavailable. Please try again soon.')
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Error creating checkout session. Please try again.')
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus('cancelled')
        setShowCancelModal(false)
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 5000)
        // Refresh the page to update subscription context
        window.location.reload()
      } else {
        const errorData = await response.json()
        console.error('Failed to cancel subscription:', errorData.error)
        alert('Failed to cancel subscription. Please try again.')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Error cancelling subscription. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleConnectReddit = async () => {
    setIsConnectingReddit(true)
    try {
      const response = await fetch('/api/auth/reddit')
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        alert('Failed to initiate Reddit connection')
      }
    } catch (error) {
      console.error('Failed to connect Reddit:', error)
      alert('Failed to connect Reddit')
    } finally {
      setIsConnectingReddit(false)
    }
  }

  const handleDisconnectReddit = async () => {
    try {
      const response = await fetch('/api/auth/reddit/disconnect', {
        method: 'POST'
      })
      if (response.ok) {
        setRedditConnected(false)
        setRedditUsername('')
        alert('Reddit disconnected successfully')
      } else {
        alert('Failed to disconnect Reddit')
      }
    } catch (error) {
      console.error('Failed to disconnect Reddit:', error)
      alert('Failed to disconnect Reddit')
    }
  }

  const handleSave = (section: string) => {
    // TODO: Implement save functionality
    console.log(`Saving ${section}:`, formData)
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'account', name: 'Account', icon: Link },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'billing', name: 'Billing', icon: CreditCard },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check if user is connected via Google OAuth
  const isGoogleUser = user.app_metadata?.providers?.includes('google') || 
                      user.user_metadata?.provider === 'google' ||
                      user.identities?.some(identity => identity.provider === 'google')

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your account settings and preferences.
            </p>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Reddit Connected Successfully!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your Reddit account has been connected. You can now start finding leads on Reddit.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                  <p className="text-sm text-gray-500">Update your account information.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="label-base">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 input-base"
                    />
                  </div>
                </div>

                {!isGoogleUser && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                          Current Password
                        </label>
                        <div className="relative mt-1">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="currentPassword"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            className="input-base pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          className="mt-1 input-base"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isGoogleUser && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Password Management</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Google Account</h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>Your account is connected via Google. Password changes are managed through your Google account settings.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave('profile')}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Connected Accounts</h3>
                  <p className="text-sm text-gray-500">Manage your connected third-party accounts.</p>
                </div>

                <div className="space-y-4">
                  {/* Reddit Connection */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Reddit</h4>
                          <p className="text-sm text-gray-500">
                            {redditConnected 
                              ? `Connected as u/${redditUsername}` 
                              : 'Connect your Reddit account to enable lead discovery'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {redditConnected ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <button
                              onClick={handleDisconnectReddit}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleConnectReddit}
                            disabled={isConnectingReddit}
                            className="inline-flex items-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50"
                          >
                            {isConnectingReddit ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Connecting...
                              </>
                            ) : (
                              'Connect Reddit'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {!redditConnected && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Why connect Reddit?</h3>
                            <div className="mt-1 text-sm text-blue-700">
                              <p>Connecting your Reddit account allows Truleado to:</p>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Monitor relevant subreddits for your products</li>
                                <li>Find potential customers discussing your solutions</li>
                                <li>Provide better lead discovery with authenticated access</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                  <p className="text-sm text-gray-500">Choose how you want to be notified.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, email: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">New Leads</h4>
                      <p className="text-sm text-gray-500">Get notified when new leads are found</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications.newLeads}
                      onChange={(e) => setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, newLeads: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Weekly Reports</h4>
                      <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications.weeklyReport}
                      onChange={(e) => setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, weeklyReport: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave('notifications')}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Billing & Subscription</h3>
                    <p className="text-sm text-gray-500">Manage your subscription and billing information.</p>
                  </div>
                  <button
                    onClick={handleRefreshBilling}
                    disabled={isRefreshing}
                    className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {/* Current Plan Status */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">
                          {subscriptionStatus === 'active' ? 'Pro Plan Active' : 
                           subscriptionStatus === 'cancelled' ? 'Plan Cancelled' :
                           accessLevel === 'full' ? 'Free Trial' : 'Free Plan'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {subscriptionStatus === 'active' ? 'Full access to all features' :
                           subscriptionStatus === 'cancelled' ? 'Limited access - subscription cancelled' :
                           accessLevel === 'full' 
                            ? (trialTimeRemaining === 'Trial expired' ? 'Trial has ended - upgrade to continue' : `Trial ends in ${trialTimeRemaining}`)
                            : 'Limited features available'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {subscriptionStatus === 'active' && (
                        <div className="text-sm text-gray-600">
                          <p className="font-medium text-gray-900">$30/month</p>
                          <p>Next billing: {billingInfo.nextBillingDate || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Billing Information - Only show for active subscribers */}
                {subscriptionStatus === 'active' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Method */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Payment Method</h4>
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Card</span>
                          <span className="text-sm font-medium text-gray-900">{billingInfo.paymentMethod}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Amount</span>
                          <span className="text-sm font-medium text-gray-900">{billingInfo.amount}/month</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Next billing</span>
                          <span className="text-sm font-medium text-gray-900">{billingInfo.nextBillingDate || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          Update Payment Method
                        </button>
                      </div>
                    </div>

                    {/* Billing History */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Billing History</h4>
                        <Download className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="space-y-3">
                        {billingInfo.invoiceHistory.length > 0 ? (
                          billingInfo.invoiceHistory.slice(0, 3).map((invoice: any, index: number) => (
                            <div key={index} className="flex items-center justify-between py-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{invoice.date}</p>
                                <p className="text-xs text-gray-500">{invoice.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{invoice.amount}</p>
                                <button className="text-xs text-blue-600 hover:text-blue-800">Download</button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No billing history yet</p>
                          </div>
                        )}
                      </div>
                      {billingInfo.invoiceHistory.length > 3 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View All Invoices
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Subscription Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Upgrade/Downgrade */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Plan Management</h4>
                      <Zap className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    {subscriptionStatus === 'active' ? (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-sm font-medium text-green-800">Pro Plan Active</span>
                          </div>
                          <p className="text-xs text-green-700 mt-1">You have full access to all features</p>
                        </div>
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="w-full inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </button>
                      </div>
                    ) : subscriptionStatus === 'cancelled' ? (
                      <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                            <span className="text-sm font-medium text-yellow-800">Subscription Cancelled</span>
                          </div>
                          <p className="text-xs text-yellow-700 mt-1">Limited access to features</p>
                        </div>
                        <button
                          onClick={handleUpgrade}
                          disabled={isUpgrading}
                          className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpgrading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4 mr-2" />
                              Resubscribe
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <Clock className="w-5 h-5 text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-blue-800">
                              {accessLevel === 'full' ? 'Free Trial' : 'Free Plan'}
                            </span>
                          </div>
                          <p className="text-xs text-blue-700 mt-1">
                            {accessLevel === 'full' 
                              ? (trialTimeRemaining === 'Trial expired' ? 'Trial has ended - upgrade to continue' : `Trial ends in ${trialTimeRemaining}`)
                              : 'Limited features available'
                            }
                          </p>
                        </div>
                        <button
                          onClick={handleUpgrade}
                          disabled={isUpgrading}
                          className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpgrading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4 mr-2" />
                              Upgrade to Pro
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Refund Policy */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Refund Policy</h4>
                      <Shield className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">14-Day Money Back Guarantee</p>
                          <p className="text-xs text-gray-600">Full refund within 14 days, no questions asked</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Cancel Anytime</p>
                          <p className="text-xs text-gray-600">No long-term contracts or commitments</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Instant Access</p>
                          <p className="text-xs text-gray-600">Resubscribe anytime to regain full access</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <a 
                        href="/refund" 
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Full Refund Policy →
                      </a>
                    </div>
                  </div>
                </div>

                {/* Support Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">Need Help?</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Have questions about billing or need assistance with your subscription?
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <a 
                        href="mailto:support@truleado.com"
                        className="inline-flex items-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                      >
                        Contact Support
                      </a>
                      <a 
                        href="/support"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                      >
                        Help Center
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Cancel Subscription</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? This action will:
            </p>
            
            <ul className="text-sm text-gray-600 mb-6 space-y-2">
              <li className="flex items-center">
                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                Immediately revoke access to all premium features
              </li>
              <li className="flex items-center">
                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                Stop all future billing
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Allow you to resubscribe at any time
              </li>
            </ul>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isCancelling}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default function Settings() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  )
}

