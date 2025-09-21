'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  AlertTriangle
} from 'lucide-react'

export default function Settings() {
  const { user, loading } = useAuth()
  const { accessLevel, trialTimeRemaining, showUpgradePrompt } = useSubscription()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [redditConnected, setRedditConnected] = useState(false)
  const [redditUsername, setRedditUsername] = useState('')
  const [isConnectingReddit, setIsConnectingReddit] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState('')
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
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error)
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
    
    if (success === 'reddit_connected') {
      // Refresh Reddit connection status after successful OAuth
      checkRedditConnection()
      setShowSuccessMessage(true)
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
  }, [])

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
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.checkout_url
      } else {
        console.error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
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
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Billing & Subscription</h3>
                  <p className="text-sm text-gray-500">Manage your subscription and billing information.</p>
                </div>

                {/* Current Plan Status */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {subscriptionStatus === 'active' ? 'Pro Plan' : 
                         subscriptionStatus === 'cancelled' ? 'Cancelled Plan' :
                         accessLevel === 'full' ? 'Trial Plan' : 'Free Plan'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {subscriptionStatus === 'active' ? 'Your subscription is active' :
                         subscriptionStatus === 'cancelled' ? 'Your subscription has been cancelled' :
                         accessLevel === 'full' 
                          ? `Trial ends in ${trialTimeRemaining}`
                          : 'You\'re currently on the free plan'
                        }
                      </p>
                    </div>
                    {subscriptionStatus !== 'active' && (
                      <button 
                        onClick={handleUpgrade}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </button>
                    )}
                  </div>
                </div>

                {/* Subscription Management */}
                {subscriptionStatus === 'active' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-red-900">Cancel Subscription</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Cancelling your subscription will immediately revoke access to all premium features. 
                          You can resubscribe at any time.
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Subscription
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancelled Subscription Info */}
                {subscriptionStatus === 'cancelled' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-yellow-900">Subscription Cancelled</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Your subscription has been cancelled. You now have limited access to features. 
                          Upgrade again to regain full access.
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={handleUpgrade}
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Resubscribe
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

