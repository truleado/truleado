'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/lib/subscription-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/app-layout'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
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
  Bell,
  Plane,
  MessageSquare,
  Search,
  Eye,
  Calendar,
  TrendingDown,
  ArrowRight,
  Play,
  BookOpen,
  Lightbulb
} from 'lucide-react'

interface DashboardStats {
  totalRedditLeads: number
  researchSessions: number
  keywordsAnalyzed: number
  leadsThisWeek: number
  leadsToday: number
  avgLeadQuality: number
}

interface RecentActivity {
  id: string
  type: 'research' | 'lead_saved' | 'keyword_analysis' | 'reddit_search'
  message: string
  time: string
  icon: string
  link?: string
}

interface QuickAction {
  title: string
  description: string
  icon: any
  href: string
  color: string
  bgColor: string
  textColor: string
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const { subscriptionStatus, trialTimeRemaining, accessLevel, refreshSubscription } = useSubscription()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalRedditLeads: 0,
    researchSessions: 0,
    keywordsAnalyzed: 0,
    leadsThisWeek: 0,
    leadsToday: 0,
    avgLeadQuality: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [currentTrialTime, setCurrentTrialTime] = useState(trialTimeRemaining)

  // Icon mapping
  const iconMap: { [key: string]: any } = {
    Users,
    Package,
    Activity,
    CheckCircle,
    AlertCircle,
    Plane,
    MessageSquare,
    Search,
    Brain,
    Globe
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      refreshSubscription()
    }
  }, [user, refreshSubscription])

  // Real-time trial countdown
  useEffect(() => {
    if (subscriptionStatus === 'trial' && trialTimeRemaining && trialTimeRemaining !== 'Trial expired') {
      setCurrentTrialTime(trialTimeRemaining)
      
      const interval = setInterval(() => {
        refreshSubscription()
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [subscriptionStatus, trialTimeRemaining, refreshSubscription])

  useEffect(() => {
    setCurrentTrialTime(trialTimeRemaining)
  }, [trialTimeRemaining])

  const fetchDashboardData = async () => {
    try {
      // Fetch Reddit leads stats
      const leadsResponse = await fetch('/api/reddit-leads', {
        credentials: 'include',
      })
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        const leads = leadsData.leads || []
        
        // Calculate stats from Reddit leads
        const today = new Date()
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        const leadsToday = leads.filter((lead: any) => {
          const leadDate = new Date(lead.saved_at)
          return leadDate.toDateString() === today.toDateString()
        }).length
        
        const leadsThisWeek = leads.filter((lead: any) => {
          const leadDate = new Date(lead.saved_at)
          return leadDate >= oneWeekAgo
        }).length
        
        // Calculate average quality score (if available)
        const avgQuality = leads.length > 0 ? 
          leads.reduce((sum: number, lead: any) => sum + (lead.quality_score || 3), 0) / leads.length : 0
        
        setStats({
          totalRedditLeads: leads.length,
          researchSessions: Math.floor(leads.length / 3) + 1, // Estimate based on leads
          keywordsAnalyzed: new Set(leads.map((lead: any) => lead.keyword)).size,
          leadsThisWeek,
          leadsToday,
          avgLeadQuality: Math.round(avgQuality * 10) / 10
        })
      }
      setStatsLoading(false)

      // Generate recent activity from Reddit leads
      const activityResponse = await fetch('/api/reddit-leads', {
        credentials: 'include',
      })
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        const leads = activityData.leads || []
        
        // Convert leads to activity items
        const activities: RecentActivity[] = leads.slice(0, 5).map((lead: any) => ({
          id: lead.id,
          type: 'lead_saved',
          message: `Saved lead from r/${lead.subreddit}: "${lead.title.substring(0, 50)}..."`,
          time: new Date(lead.saved_at).toLocaleDateString(),
          icon: 'MessageSquare',
          link: '/reddit-leads'
        }))
        
        setRecentActivity(activities)
      }
      setActivityLoading(false)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStatsLoading(false)
      setActivityLoading(false)
    }
  }

  const statsCards = [
    {
      name: 'Reddit Leads',
      value: stats.totalRedditLeads.toString(),
      change: stats.leadsToday > 0 ? `+${stats.leadsToday} today` : '0 today',
      changeType: stats.leadsToday > 0 ? 'positive' : 'neutral',
      icon: MessageSquare,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      description: 'Strategic opportunities saved'
    },
    {
      name: 'Research Sessions',
      value: stats.researchSessions.toString(),
      change: stats.researchSessions > 0 ? 'Active' : 'None',
      changeType: stats.researchSessions > 0 ? 'positive' : 'neutral',
      icon: Search,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      description: 'Website analyses completed'
    },
    {
      name: 'Keywords Analyzed',
      value: stats.keywordsAnalyzed.toString(),
      change: stats.keywordsAnalyzed > 0 ? 'Unique terms' : 'None',
      changeType: stats.keywordsAnalyzed > 0 ? 'positive' : 'neutral',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      description: 'Search terms discovered'
    },
    {
      name: 'This Week',
      value: stats.leadsThisWeek.toString(),
      change: stats.leadsThisWeek > 0 ? 'New opportunities' : 'No leads',
      changeType: stats.leadsThisWeek > 0 ? 'positive' : 'neutral',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      description: 'Leads discovered this week'
    },
  ]

  const quickActions: QuickAction[] = [
    {
      title: 'Research Website',
      description: 'Analyze any website and discover Reddit opportunities',
      icon: Search,
      href: '/research',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'View Reddit Leads',
      description: 'Browse your saved strategic opportunities',
      icon: MessageSquare,
      href: '/reddit-leads',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'Track Performance',
      description: 'Monitor lead performance and analytics',
      icon: BarChart3,
      href: '/track-leads',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ]

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.email?.split('@')[0]}! 👋
                </h1>
                <p className="text-lg text-gray-600">
                  Your Reddit lead discovery command center
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/research"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Start Research
                </Link>
              </div>
            </div>
          </div>

          {/* Pro Plan Status */}
          {subscriptionStatus === 'active' && (
            <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-green-800">Pro Plan Active</h3>
                  <p className="text-base text-green-700">
                    You have access to all premium features. Thank you for being a Pro user!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trial Status */}
          {subscriptionStatus === 'trial' && currentTrialTime && currentTrialTime !== 'Trial expired' && (
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-blue-800">Free Trial Active</h3>
                  <p className="text-base text-blue-700">
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {statsCards.map((stat) => (
              <div
                key={stat.name}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    )}
                    {statsLoading ? (
                      <div className="mt-2 animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                    ) : (
                      <p className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0 ml-3`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group block w-full rounded-2xl border-2 border-gray-200 p-6 text-center transition-all duration-200 hover:border-gray-300 hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className={`w-16 h-16 ${action.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                      <action.icon className={`w-8 h-8 ${action.textColor}`} />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {action.description}
                  </p>
                  <div className="inline-flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-700">
                    Get started
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Getting Started Guide */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Getting Started</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Research Websites</h4>
                  <p className="text-gray-600 mb-3">
                    Analyze any website to extract keywords and discover Reddit opportunities
                  </p>
                  <Link
                    href="/research"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Start Research
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-red-600">2</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Save Strategic Leads</h4>
                  <p className="text-gray-600 mb-3">
                    Save high-quality Reddit posts with AI-generated pitch ideas
                  </p>
                  <Link
                    href="/reddit-leads"
                    className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
                  >
                    View Leads
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">3</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Track Performance</h4>
                  <p className="text-gray-600 mb-3">
                    Monitor lead performance and optimize your Reddit strategy
                  </p>
                  <Link
                    href="/track-leads"
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Track Analytics
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Recent Activity</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Activity className="w-4 h-4 mr-2" />
                Live Updates
              </div>
            </div>
            <div className="mt-6">
              {activityLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="animate-pulse bg-gray-200 h-12 w-12 rounded-2xl"></div>
                      <div className="flex-1">
                        <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                        <div className="animate-pulse bg-gray-200 h-3 w-1/4 rounded"></div>
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
                              className="absolute left-6 top-6 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-4">
                            <div>
                              <span className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                {activity.icon && iconMap[activity.icon] && React.createElement(iconMap[activity.icon], { className: "h-5 w-5 text-gray-500" })}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h3>
                  <p className="text-base text-gray-600 mb-6">
                    Start by researching your first website to begin discovering Reddit opportunities.
                  </p>
                  <Link
                    href="/research"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Start Research
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