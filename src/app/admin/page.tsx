'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  TrendingUp,
  Package,
  Target,
  DollarSign,
  Calendar,
  BarChart3,
  Shield,
  Eye,
  UserCheck,
  Activity,
  Database,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Download,
  X,
  ExternalLink
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  totalSubscriptions: number
  activeSubscriptions: number
  totalProducts: number
  totalLeads: number
  leadsThisMonth: number
  totalRevenue: number
  revenueThisMonth: number
  averageLeadsPerUser: number
  conversionRate: number
}

interface User {
  id: string
  email: string
  full_name?: string
  created_at: string
  updated_at?: string
  last_activity?: string
  subscription_status: string
  subscription_plan: string
  products_count: number
  leads_count: number
  chat_find_searches: number
  chat_find_leads: number
  traditional_leads: number
  total_revenue: number
  is_active: boolean
  chat_find_searches_count: number
  chat_find_free_searches_used: number
  products?: Product[]
}

interface Product {
  id: string
  name: string
  description?: string
  website_url?: string
  status: string
  created_at: string
  subreddits: string[]
}

interface RecentActivity {
  id: string
  type: 'signup' | 'subscription' | 'product_added' | 'lead_generated'
  user_email: string
  description: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics'>('overview')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated')
    if (adminAuth === 'true') {
      setIsAuthenticated(true)
      loadAdminData()
    }
  }, [])

  const loadAdminData = async () => {
    setIsLoading(true)
    try {
      // Load stats
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load users
      const usersResponse = await fetch('/api/admin/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Load recent activity
      const activityResponse = await fetch('/api/admin/activity')
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData)
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'Netsky4933#') {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
      loadAdminData()
    } else {
      alert('Invalid password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('admin_authenticated')
    setPassword('')
    setStats(null)
    setUsers([])
    setRecentActivity([])
  }

  const exportToCSV = () => {
    if (users.length === 0) return

    const headers = [
      'Name',
      'Email', 
      'Created At',
      'Subscription Status',
      'Chat & Find',
      'Promote',
      'Products Count',
      'Leads Count',
      'Chat Find Searches',
      'Total Revenue',
      'Is Active'
    ]

    const csvData = users.map(user => [
      user.full_name || 'No Name',
      user.email,
      new Date(user.created_at).toLocaleDateString(),
      user.subscription_status,
      user.chat_find_searches_count > 0 || user.chat_find_searches > 0 ? 'Yes' : 'No',
      user.products_count > 0 ? 'Yes' : 'No',
      user.products_count,
      user.leads_count,
      user.chat_find_searches,
      user.total_revenue,
      user.is_active ? 'Yes' : 'No'
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-users-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const viewUserDetails = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/user-details?userId=${user.id}`)
      if (response.ok) {
        const userDetails = await response.json()
        setSelectedUser(userDetails)
        setShowUserDetail(true)
      }
    } catch (error) {
      console.error('Error loading user details:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-gray-600">Enter password to access admin dashboard</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              All Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Users</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <Target className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Leads</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.totalLeads}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                          <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <Package className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Products</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {recentActivity.slice(0, 10).map((activity) => (
                        <div key={activity.id} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Activity className="h-4 w-4 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm text-gray-900">{activity.description}</p>
                                <p className="text-xs text-gray-500">{activity.user_email}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">All Users</h2>
                    <button
                      onClick={exportToCSV}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </button>
                  </div>

                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Chat & Find
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Promote
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Products
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Leads
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Revenue
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.full_name || 'No Name'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.subscription_status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.subscription_status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.chat_find_searches_count > 0 || user.chat_find_searches > 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.chat_find_searches_count > 0 || user.chat_find_searches > 0 ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.products_count > 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.products_count > 0 ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.products_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.leads_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${user.total_revenue}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => viewUserDetails(user)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Today</span>
                          <span className="text-sm font-medium">{stats.newUsersToday}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">This Week</span>
                          <span className="text-sm font-medium">{stats.newUsersThisWeek}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">This Month</span>
                          <span className="text-sm font-medium">{stats.newUsersThisMonth}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Generation</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Total Leads</span>
                          <span className="text-sm font-medium">{stats.totalLeads}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">This Month</span>
                          <span className="text-sm font-medium">{stats.leadsThisMonth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Avg per User</span>
                          <span className="text-sm font-medium">{stats.averageLeadsPerUser.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.full_name || 'No Name'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subscription Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.subscription_status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Products Count</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.products_count}</p>
                </div>
              </div>

              {selectedUser.products && selectedUser.products.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Products</label>
                  <div className="space-y-2">
                    {selectedUser.products.map((product) => (
                      <div key={product.id} className="border rounded-md p-3">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        {product.description && (
                          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                        )}
                        {product.website_url && (
                          <a
                            href={product.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-1"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Visit Website
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}