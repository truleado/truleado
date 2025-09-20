'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/app-layout'
import Link from 'next/link'
import { 
  TrendingUp, 
  Users, 
  Package, 
  Search, 
  Plus,
  ArrowUpRight,
  Activity,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  ExternalLink
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
    }
  }, [user])

  const handleRedditConnect = async () => {
    try {
      const response = await fetch('/api/auth/reddit')
      if (response.ok) {
        const data = await response.json()
        if (data.authUrl) {
          window.location.href = data.authUrl
        }
      } else {
        console.error('Failed to get Reddit OAuth URL')
      }
    } catch (error) {
      console.error('Error connecting to Reddit:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/dashboard/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
        setHasProducts(statsData.activeProducts > 0)
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/dashboard/activity')
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData)
      }

      // Fetch trends
      const trendsResponse = await fetch('/api/dashboard/trends')
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        setTrends(trendsData)
      }

      // Check Reddit connection status
      const redditResponse = await fetch('/api/auth/reddit/status')
      if (redditResponse.ok) {
        const redditData = await redditResponse.json()
        setRedditConnected(redditData.connected)
      }

      // Check if lead finding is active (has active jobs)
      const jobsResponse = await fetch('/api/debug/current-jobs')
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        setLeadFindingActive(jobsData.jobs && jobsData.jobs.length > 0)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setStatsLoading(false)
      setActivityLoading(false)
      setTrendsLoading(false)
    }
  }

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

  const statsCards = [
    {
      name: 'Total Leads',
      value: stats.totalLeads.toString(),
      change: stats.leadsToday > 0 ? `+${stats.leadsToday} today` : '0 today',
      changeType: stats.leadsToday > 0 ? 'positive' : 'neutral',
      icon: Users,
    },
    {
      name: 'Active Products',
      value: stats.activeProducts.toString(),
      change: stats.activeProducts > 0 ? 'Monitoring' : 'None',
      changeType: stats.activeProducts > 0 ? 'positive' : 'neutral',
      icon: Package,
    },
    {
      name: 'Subreddits Monitored',
      value: stats.subredditsMonitored.toString(),
      change: stats.subredditsMonitored > 0 ? 'Active' : 'None',
      changeType: stats.subredditsMonitored > 0 ? 'positive' : 'neutral',
      icon: Search,
    },
    {
      name: 'This Week',
      value: stats.leadsThisWeek.toString(),
      change: stats.conversionRate > 0 ? `${stats.conversionRate}% conversion` : '0% conversion',
      changeType: stats.conversionRate > 0 ? 'positive' : 'neutral',
      icon: TrendingUp,
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Welcome back, {user.email?.split('@')[0]}!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Here's what's happening with your Reddit lead generation.
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <Activity className="w-4 h-4 mr-2" />
              View Reports
            </button>
            <Link
              href="/products"
              className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <div
              key={stat.name}
              className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
            >
              <dt>
                <div className="absolute rounded-md bg-blue-500 p-3">
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                )}
                {statsLoading ? (
                  <div className="ml-2 animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                ) : (
                  <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {stat.change}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </div>

        {/* Let's get started quick */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Let's get started quick</h3>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Step 1: Connect Reddit */}
              <div className={`relative block w-full rounded-lg border-2 p-6 text-center transition-all duration-200 ${
                redditConnected 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-dashed border-gray-300 hover:border-gray-400'
              }`}>
                {redditConnected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                )}
                <div className="flex items-center justify-center">
                  {redditConnected ? (
                    <CheckCircle className="mx-auto h-8 w-8 text-green-600" />
                  ) : (
                    <Search className="mx-auto h-8 w-8 text-gray-400" />
                  )}
                </div>
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  {redditConnected ? 'Reddit Connected!' : 'Connect Reddit Account'}
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  {redditConnected 
                    ? 'Your Reddit account is ready for lead discovery' 
                    : 'Connect your Reddit account to start finding leads'
                  }
                </span>
                {!redditConnected && (
                  <button 
                    onClick={handleRedditConnect}
                    className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Connect Now
                  </button>
                )}
              </div>

              {/* Step 2: Add Products */}
              <div className={`relative block w-full rounded-lg border-2 p-6 text-center transition-all duration-200 ${
                hasProducts 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-dashed border-gray-300 hover:border-gray-400'
              }`}>
                {hasProducts && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                )}
                <div className="flex items-center justify-center">
                  {hasProducts ? (
                    <CheckCircle className="mx-auto h-8 w-8 text-green-600" />
                  ) : (
                    <Package className="mx-auto h-8 w-8 text-gray-400" />
                  )}
                </div>
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  {hasProducts ? 'Products Added!' : 'Add Your Products'}
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  {hasProducts 
                    ? 'Your products are ready for lead discovery' 
                    : 'Define what your SaaS does to start finding leads'
                  }
                </span>
                {!hasProducts && (
                  <Link 
                    href="/products" 
                    className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Product
                  </Link>
                )}
              </div>

              {/* Step 3: Lead Finding Magic */}
              <div className={`relative block w-full rounded-lg border-2 p-6 text-center transition-all duration-200 ${
                (redditConnected && hasProducts) || leadFindingActive
                  ? 'border-green-300 bg-green-50' 
                  : 'border-dashed border-gray-300'
              }`}>
                {(redditConnected && hasProducts) || leadFindingActive ? (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                ) : null}
                <div className="flex items-center justify-center">
                  {(redditConnected && hasProducts) || leadFindingActive ? (
                    <Sparkles className="mx-auto h-8 w-8 text-green-600" />
                  ) : (
                    <Zap className="mx-auto h-8 w-8 text-gray-400" />
                  )}
                </div>
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  {(redditConnected && hasProducts) || leadFindingActive 
                    ? 'Lead Finding Active! 🚀' 
                    : 'Lead Finding Ready'
                  }
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  {(redditConnected && hasProducts) || leadFindingActive
                    ? 'We\'re automatically finding leads for you!' 
                    : 'Complete steps 1 & 2 to start the magic'
                  }
                </span>
                {(redditConnected && hasProducts) && !leadFindingActive && (
                  <div className="mt-3">
                    <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Starting automatically...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lead Trends Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Lead Trends (Last 7 Days)</h3>
            <div className="mt-5">
              {trendsLoading ? (
                <div className="h-64 flex items-end justify-between space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-t animate-pulse" style={{ height: '60px' }}></div>
                      <span className="text-xs text-gray-500 mt-2">Loading...</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-end justify-between space-x-2">
                  {trends.map((trend, index) => {
                    const maxCount = Math.max(...trends.map(t => t.count), 1)
                    const height = maxCount > 0 ? (trend.count / maxCount) * 200 + 20 : 20
                    
                    return (
                      <div key={trend.date} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500 rounded-t relative group"
                          style={{ 
                            height: `${height}px`,
                            minHeight: '20px'
                          }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {trend.count} leads
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 mt-2">
                          {trend.dayName}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
              <button
                onClick={fetchDashboardData}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Refresh
              </button>
            </div>
            <div className="mt-5">
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
                      <div className="flex-1">
                        <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
                        <div className="animate-pulse bg-gray-200 h-3 w-1/4 rounded mt-1"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="flow-root">
                  <ul role="list" className="-mb-8">
                    {recentActivity.map((activity, activityIdx) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== recentActivity.length - 1 ? (
                            <span
                              className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                {activity.icon && iconMap[activity.icon] && React.createElement(iconMap[activity.icon], { className: "h-4 w-4 text-gray-500" })}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">{activity.message}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
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
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start by adding your first product to begin finding leads.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

