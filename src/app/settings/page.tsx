'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import AppLayout from '@/components/app-layout'
import { useSubscription } from '@/lib/subscription-context'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
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
  Zap,
  Target
} from 'lucide-react'

function SettingsContent() {
  const { user, loading } = useAuth()
  const { accessLevel, trialTimeRemaining, showUpgradePrompt, refreshSubscription, subscriptionStatus } = useSubscription()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [redditConnected, setRedditConnected] = useState(false)
  const [redditUsername, setRedditUsername] = useState('')
  const [isConnectingReddit, setIsConnectingReddit] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
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

  // Ensure notifications object is always properly initialized
  const safeNotifications = formData.notifications || {
    email: true,
    newLeads: true,
    weeklyReport: true,
  }

  useEffect(() => {
    const initializeSettings = async () => {
      try {
        if (!loading && !user) {
          router.push('/auth/signin')
          return
        }
        if (user) {
          setFormData(prev => ({ ...prev, email: user.email || '' }))
          
          // Call these functions safely
          try {
            await checkRedditConnection()
          } catch (err) {
            console.error('Reddit connection check failed:', err)
          }
          
          try {
            await fetchSubscriptionStatus()
          } catch (err) {
            console.error('Subscription status fetch failed:', err)
          }
          
          try {
            await fetchUserPreferences()
          } catch (err) {
            console.error('User preferences fetch failed:', err)
          }
          
        }
      } catch (err) {
        console.error('Settings initialization error:', err)
        setError('Failed to initialize settings')
      }
    }

    initializeSettings()
  }, [user, loading, router])

  const fetchSubscriptionStatus = async () => {
    try {
      // Refresh subscription status from context
      await refreshSubscription()
      
      // Fetch billing info if user has active subscription
      if (subscriptionStatus === 'active') {
        await fetchBillingInfo()
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
          amount: data.amount || '$29',
          paymentMethod: data.payment_method || 'Card ending in ****',
          invoiceHistory: data.invoices || []
        })
      }
    } catch (error) {
      console.error('Error fetching billing info:', error)
    }
  }

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.preferences && typeof data.preferences === 'object') {
          setFormData(prev => ({
            ...prev,
            notifications: {
              email: data.preferences.email ?? true,
              newLeads: data.preferences.newLeads ?? true,
              weeklyReport: data.preferences.weeklyReport ?? true,
            }
          }))
        }
      } else {
        console.error('Failed to fetch user preferences:', response.status)
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      // Don't throw the error, just log it to prevent ErrorBoundary from catching it
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

  const handleSave = async (section: string) => {
    try {
      if (section === 'profile') {
        // Update email and password
        const response = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
        })

        if (response.ok) {
          setShowSuccessMessage(true)
          setTimeout(() => setShowSuccessMessage(false), 3000)
          // Clear password fields
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }))
        } else {
          const error = await response.json()
          alert(`Failed to update profile: ${error.message || 'Unknown error'}`)
        }
      } else if (section === 'notifications') {
        // Update notification preferences
        try {
          const response = await fetch('/api/user/preferences', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notifications: safeNotifications,
            }),
          })

          if (response.ok) {
            setShowSuccessMessage(true)
            setTimeout(() => setShowSuccessMessage(false), 3000)
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            alert(`Failed to update notifications: ${errorData.error || 'Unknown error'}`)
          }
        } catch (error) {
          console.error('Error updating notifications:', error)
          alert('Failed to update notifications. Please try again.')
        }
      }
    } catch (error) {
      console.error(`Failed to save ${section}:`, error)
      alert(`Failed to save ${section}. Please try again.`)
    }
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

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Settings</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Check if user is connected via Google OAuth
  const isGoogleUser = user.app_metadata?.providers?.includes('google') || 
                      user.user_metadata?.provider === 'google' ||
                      user.identities?.some(identity => identity.provider === 'google')

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Settings
            </h1>
            <p className="text-lg text-gray-600">
              Manage your account settings and preferences.
            </p>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-green-800">Reddit Connected Successfully!</h3>
                  <div className="mt-2 text-green-700">
                    <p>Your Reddit account has been connected. You can now start finding leads on Reddit.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
            <div className="border-b border-gray-200/50">
              <nav className="flex space-x-8 px-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    } whitespace-nowrap py-6 px-4 border-b-2 font-semibold text-sm flex items-center gap-3 transition-all duration-200 rounded-t-xl`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile Information</h3>
                    <p className="text-gray-600">Update your account information and personal details.</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>


                  {!isGoogleUser && (
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h4>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              id="currentPassword"
                              value={formData.currentPassword}
                              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            id="newPassword"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {isGoogleUser && (
                    <div className="bg-blue-50 rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Password Management</h4>
                      <div className="bg-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-sm font-semibold text-blue-800">Google Account</h3>
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
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </button>
                  </div>
              </div>
            )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Connected Accounts</h3>
                    <p className="text-gray-600">Manage your connected third-party accounts and integrations.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Reddit Connection */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                            <ExternalLink className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Reddit</h4>
                            <p className="text-gray-600">
                              {redditConnected 
                                ? `Connected as u/${redditUsername}` 
                                : 'Connect your Reddit account to enable lead discovery'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {redditConnected ? (
                            <>
                              <CheckCircle className="w-6 h-6 text-green-500" />
                              <button
                                onClick={handleDisconnectReddit}
                                className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors"
                              >
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleConnectReddit}
                              disabled={isConnectingReddit}
                              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                              {isConnectingReddit ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <AlertCircle className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="ml-4">
                              <h3 className="text-sm font-semibold text-blue-800">Why connect Reddit?</h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <p>Connecting your Reddit account allows Truleado to:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
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
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h3>
                    <p className="text-gray-600">Choose how you want to be notified about new leads and updates.</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Email Notifications</h4>
                            <p className="text-gray-600">Receive notifications via email</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={safeNotifications.email}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: { ...safeNotifications, email: e.target.checked }
                          })}
                          className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Target className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">New Leads</h4>
                            <p className="text-gray-600">Get notified when new leads are found</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={safeNotifications.newLeads}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: { ...safeNotifications, newLeads: e.target.checked }
                          })}
                          className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Weekly Reports</h4>
                            <p className="text-gray-600">Receive weekly summary reports</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={safeNotifications.weeklyReport}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: { ...safeNotifications, weeklyReport: e.target.checked }
                          })}
                          className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave('notifications')}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Billing & Subscription</h3>
                      <p className="text-gray-600">Manage your subscription and billing information.</p>
                    </div>
                    <button
                      onClick={handleRefreshBilling}
                      disabled={isRefreshing}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
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
                          <p className="font-medium text-gray-900">$29/month</p>
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
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}

