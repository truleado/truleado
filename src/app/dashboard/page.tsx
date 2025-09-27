'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/lib/subscription-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/app-layout'
import PaddleCheckout from '@/components/PaddleCheckout'
import Link from 'next/link'
import { 
  TrendingUp, 
  Users, 
  Package, 
  Filter, 
  Plus,
  ArrowUpRight,
  Activity,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  ExternalLink,
  Clock,
  CreditCard,
  Star,
  Brain,
  Globe,
  Bell
} from 'lucide-react'

interface DashboardStats {
  totalLeads: number
  activeProducts: number
  subredditsMonitored: number
  leadsThisWeek: number
  leadsToday: number
  conversionRate: number
}

interface RecentActivity {
  id: string
  type: 'lead' | 'product' | 'job'
  message: string
  time: string
  icon: string
}

interface TrendData {
  date: string
  count: number
  dayName: string
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const { subscriptionStatus, trialTimeRemaining, accessLevel, refreshSubscription } = useSubscription()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeProducts: 0,
    subredditsMonitored: 0,
    leadsThisWeek: 0,
    leadsToday: 0,
    conversionRate: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [trendsLoading, setTrendsLoading] = useState(true)
  const [redditConnected, setRedditConnected] = useState(false)
  const [hasProducts, setHasProducts] = useState(false)
  const [leadFindingActive, setLeadFindingActive] = useState(false)
  const [currentTrialTime, setCurrentTrialTime] = useState(trialTimeRemaining)

  // Icon mapping
  const iconMap: { [key: string]: any } = {
    Users,
    Package,
    Activity,
    CheckCircle,
    AlertCircle
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      // Refresh subscription status to ensure it's up to date
      refreshSubscription()
    }
  }, [user, refreshSubscription])

  // Real-time trial countdown
  useEffect(() => {
    if (subscriptionStatus === 'trial' && trialTimeRemaining && trialTimeRemaining !== 'Trial expired') {
      setCurrentTrialTime(trialTimeRemaining)
      
      const interval = setInterval(() => {
        refreshSubscription() // This will update the trial time
      }, 1000) // Update every second

      return () => clearInterval(interval)
    }
  }, [subscriptionStatus, trialTimeRemaining, refreshSubscription])

  // Update current trial time when trialTimeRemaining changes
  useEffect(() => {
    setCurrentTrialTime(trialTimeRemaining)
  }, [trialTimeRemaining])


  // Check for payment success and refresh subscription
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('payment_success')
    const sessionId = urlParams.get('session_id')
    
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
  }, [user, refreshSubscription])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/dashboard/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
        setHasProducts(statsData.activeProducts > 0)
        setLeadFindingActive(statsData.activeProducts > 0 && redditConnected)
      }
      setStatsLoading(false)

      // Fetch recent activity
      const activityResponse = await fetch('/api/dashboard/activity')
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData)
      }
      setActivityLoading(false)

      // Fetch trends
      const trendsResponse = await fetch('/api/dashboard/trends')
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        setTrends(trendsData)
      }
      setTrendsLoading(false)

      // Check Reddit connection
      const redditResponse = await fetch('/api/auth/reddit/status')
      if (redditResponse.ok) {
        const redditData = await redditResponse.json()
        setRedditConnected(redditData.connected)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStatsLoading(false)
      setActivityLoading(false)
      setTrendsLoading(false)
    }
  }

  const handleRedditConnect = async () => {
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
    }
  }

  const statsCards = [
    {
      name: 'Total Leads',
      value: stats.totalLeads.toString(),
      change: stats.leadsToday > 0 ? `+${stats.leadsToday} today` : '0 today',
      changeType: stats.leadsToday > 0 ? 'positive' : 'neutral',
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Active Products',
      value: stats.activeProducts.toString(),
      change: stats.activeProducts > 0 ? 'Monitoring' : 'None',
      changeType: stats.activeProducts > 0 ? 'positive' : 'neutral',
      icon: Package,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      name: 'Subreddits Monitored',
      value: stats.subredditsMonitored.toString(),
      change: stats.subredditsMonitored > 0 ? 'Active' : 'None',
      changeType: stats.subredditsMonitored > 0 ? 'positive' : 'neutral',
      icon: Globe,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      name: 'This Week',
      value: stats.leadsThisWeek.toString(),
      change: stats.conversionRate > 0 ? `${stats.conversionRate}% conversion` : '0% conversion',
      changeType: stats.conversionRate > 0 ? 'positive' : 'neutral',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
  ]

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.email?.split('@')[0]}! 👋
                </h1>
                <p className="text-base sm:text-lg text-gray-600">
                  Here's what's happening with your Reddit lead generation.
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/products"
                  className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Add Product
                </Link>
              </div>
            </div>
          </div>


          {/* Pro Plan Status - Only show for active subscribers */}
          {subscriptionStatus === 'active' && (
            <div className="mb-6 sm:mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-semibold text-green-800">Pro Plan Active</h3>
                  <p className="text-sm sm:text-base text-green-700">
                    You have access to all premium features. Thank you for being a Pro user!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trial Status - Show for trial users */}
          {subscriptionStatus === 'trial' && currentTrialTime && currentTrialTime !== 'Trial expired' && (
            <div className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-800">Free Trial Active</h3>
                  <p className="text-sm sm:text-base text-blue-700">
                    <span className="font-bold text-lg text-blue-900">{currentTrialTime}</span> remaining. Upgrade to Pro to continue after trial ends.
                  </p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trial Expired - Show for expired trial users */}
          {subscriptionStatus === 'trial' && trialTimeRemaining === 'Trial expired' && (
            <div className="mb-6 sm:mb-8 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-semibold text-orange-800">Trial Expired</h3>
                  <p className="text-sm sm:text-base text-orange-700">
                    Your free trial has ended. Upgrade to Pro to continue using all features.
                  </p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
            {statsCards.map((stat) => (
              <div
                key={stat.name}
                className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{stat.name}</p>
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-12 sm:w-16 rounded"></div>
                    ) : (
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                    )}
                    {statsLoading ? (
                      <div className="mt-2 animate-pulse bg-gray-200 h-3 sm:h-4 w-16 sm:w-20 rounded"></div>
                    ) : (
                      <p className={`text-xs sm:text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </p>
                    )}
                  </div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ml-3`}>
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Start Guide */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-6 sm:p-8 mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Let's get started quick</h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Step 1: Connect Reddit */}
              <div className={`relative block w-full rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 text-center transition-all duration-200 ${
                redditConnected 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}>
                {redditConnected && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                )}
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  {redditConnected ? (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Filter className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  {redditConnected ? 'Reddit Connected!' : 'Connect Reddit Account'}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  {redditConnected 
                    ? 'Your Reddit account is ready for lead discovery' 
                    : 'Connect your Reddit account to start finding leads'
                  }
                </p>
                {!redditConnected && (
                  <button 
                    onClick={handleRedditConnect}
                    className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg sm:rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm"
                  >
                    Connect Now
                  </button>
                )}
              </div>

              {/* Step 2: Add Products */}
              <div className={`relative block w-full rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 text-center transition-all duration-200 ${
                hasProducts 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}>
                {hasProducts && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                )}
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  {hasProducts ? (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  {hasProducts ? 'Products Added!' : 'Add Your Products'}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  {hasProducts 
                    ? 'Your products are ready for lead discovery' 
                    : 'Define what your SaaS does to start finding leads'
                  }
                </p>
                {!hasProducts && (
                  <Link 
                    href="/products" 
                    className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm"
                  >
                    Add Product
                  </Link>
                )}
              </div>

              {/* Step 3: Lead Finding Magic */}
              <div className={`relative block w-full rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 text-center transition-all duration-200 ${
                (redditConnected && hasProducts) || leadFindingActive
                  ? 'border-green-300 bg-green-50' 
                  : 'border-dashed border-gray-300'
              }`}>
                {(redditConnected && hasProducts) || leadFindingActive ? (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                ) : null}
                <div className="flex items-center justify-center mb-4">
                  {(redditConnected && hasProducts) || leadFindingActive ? (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  {(redditConnected && hasProducts) || leadFindingActive 
                    ? 'Lead Finding Active! 🚀' 
                    : 'Lead Finding Ready'
                  }
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  {(redditConnected && hasProducts) || leadFindingActive
                    ? 'We\'re automatically finding leads for you!' 
                    : 'Complete steps 1 & 2 to start the magic'
                  }
                </p>
                {(redditConnected && hasProducts) && !leadFindingActive && (
                  <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-lg sm:rounded-xl text-sm">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Starting automatically...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lead Trends Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Lead Trends (Last 7 Days)</h3>
              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Analytics
              </div>
            </div>
            <div className="h-48 sm:h-64">
              {trendsLoading ? (
                <div className="h-full flex items-end justify-between space-x-1 sm:space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-t animate-pulse" style={{ height: '40px' }}></div>
                      <span className="text-xs text-gray-500 mt-1 sm:mt-2">Loading...</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-end justify-between space-x-1 sm:space-x-2">
                  {trends.map((trend, index) => {
                    const maxCount = Math.max(...trends.map(t => t.count), 1)
                    const height = maxCount > 0 ? (trend.count / maxCount) * 200 + 20 : 20
                    
                    return (
                      <div key={trend.date} className="flex-1 flex flex-col items-center group">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-xl sm:rounded-t-2xl relative group-hover:from-blue-600 group-hover:to-blue-500 transition-all duration-200"
                          style={{ 
                            height: `${height}px`,
                            minHeight: '20px'
                          }}
                        >
                          <div className="absolute -top-8 sm:-top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            {trend.count} leads
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 mt-2 sm:mt-3">
                          {trend.dayName}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Recent Activity</h3>
              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Live Updates
              </div>
            </div>
            <div className="mt-4 sm:mt-6">
              {activityLoading ? (
                <div className="space-y-4 sm:space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 sm:space-x-4">
                      <div className="animate-pulse bg-gray-200 h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl"></div>
                      <div className="flex-1">
                        <div className="animate-pulse bg-gray-200 h-3 sm:h-4 w-3/4 rounded mb-2"></div>
                        <div className="animate-pulse bg-gray-200 h-2 sm:h-3 w-1/4 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="flow-root">
                  <ul role="list" className="-mb-6 sm:-mb-8">
                    {recentActivity.map((activity, activityIdx) => (
                      <li key={activity.id}>
                        <div className="relative pb-6 sm:pb-8">
                          {activityIdx !== recentActivity.length - 1 ? (
                            <span
                              className="absolute left-5 sm:left-6 top-5 sm:top-6 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3 sm:space-x-4">
                            <div>
                              <span className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gray-100 flex items-center justify-center ring-4 sm:ring-8 ring-white">
                                {activity.icon && iconMap[activity.icon] && React.createElement(iconMap[activity.icon], { className: "h-4 w-4 sm:h-5 sm:w-5 text-gray-500" })}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1 sm:pt-1.5 flex justify-between space-x-2 sm:space-x-4">
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-900">{activity.message}</p>
                              </div>
                              <div className="text-right text-xs sm:text-sm whitespace-nowrap text-gray-500">
                                {activity.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No activity yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    Start by adding your first product to begin finding leads.
                  </p>
                  <Link
                    href="/products"
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Add Product
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}