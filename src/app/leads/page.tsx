'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import AppLayout from '@/components/app-layout'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { 
  Users, 
  Filter, 
  ExternalLink, 
  MessageSquare,
  Calendar,
  Tag,
  Eye,
  CheckCircle,
  XCircle,
  Play,
  Square,
  Package,
  Search,
  Target,
  Brain,
  Globe,
  Star,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { AccessGuard, UpgradeButton } from '@/components/AccessGuard'
import { useSubscription } from '@/lib/subscription-context'

interface Lead {
  id: string
  title: string
  content: string
  subreddit: string
  author: string
  url: string
  score: number
  comments: number
  createdAt: string
  status: 'new' | 'contacted' | 'interested' | 'not_interested'
  productId: string
  productName: string
  relevanceScore: number
  tags: string[]
  notes?: string
  leadType: 'post' | 'comment'
  parentPostTitle?: string
  parentPostUrl?: string
  isComment: boolean
  aiAnalysisReasons: string[]
  aiSampleReply: string
  aiAnalysisScore: number
  aiAnalysisTimestamp?: string
}

interface Product {
  id: string
  name: string
  description: string
  website: string
  features: string[]
  benefits: string[]
  painPoints: string[]
  idealCustomerProfile: string
  subreddits: string[]
  status: 'active' | 'paused'
  createdAt: string
  isFiltering?: boolean
  isUpdating?: boolean
}

function LeadsContent() {
  const { user, loading } = useAuth()
  const { canAccess, refreshSubscription } = useSubscription()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'interested' | 'not_interested'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'post' | 'comment'>('all')
  const [searchTerm, setFilterTerm] = useState('')
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [redditConnected, setRedditConnected] = useState(false)
  const [showRedditConnectionModal, setShowRedditConnectionModal] = useState(false)
  const [copiedReply, setCopiedReply] = useState<string | null>(null)
  const [redditConnectionChecked, setRedditConnectionChecked] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [leadsPerPage, setLeadsPerPage] = useState(25)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    totalLeads: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  } | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    console.log('User effect triggered:', { user: !!user, userId: user?.id, email: user?.email })
    if (user) {
      fetchProducts()
      fetchLeads()
      if (!redditConnectionChecked) {
        checkRedditConnection()
      }
    }
  }, [user, redditConnectionChecked])

  // Auto-select first product when products are loaded
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      console.log('Auto-selecting first product:', products[0].name)
      setSelectedProduct(products[0])
      setCurrentPage(1)
      fetchLeads(products[0].id, 1)
    }
  }, [products, selectedProduct])

  const checkRedditConnection = async () => {
    try {
      const response = await fetch('/api/auth/reddit/status')
      if (response.ok) {
        const data = await response.json()
        setRedditConnected(data.connected)
      }
    } catch (error) {
      console.error('Failed to check Reddit connection:', error)
    } finally {
      setRedditConnectionChecked(true)
    }
  }

  const fetchLeads = async (productId?: string, page: number = 1, limit?: number) => {
    try {
      const pageLimit = limit || leadsPerPage
      console.log('Fetching leads for product:', productId || 'all', 'page:', page, 'limit:', pageLimit)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageLimit.toString()
      })
      
      if (productId) {
        params.append('productId', productId)
      }
      
      const url = `/api/leads?${params.toString()}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })
      console.log('Leads API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Leads API response:', data)
        console.log('Number of leads:', data.leads?.length || 0)
        setLeads(data.leads || [])
        setPagination(data.pagination || null)
        setCurrentPage(page)
      } else {
        const errorText = await response.text()
        console.error('Leads API error:', response.status, response.statusText, errorText)
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        const transformedProducts = (data.products || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          website: product.website_url,
          features: product.features || [],
          benefits: product.benefits || [],
          painPoints: product.pain_points || [],
          idealCustomerProfile: product.ideal_customer_profile || '',
          subreddits: product.subreddits || [],
          status: product.status,
          createdAt: product.created_at,
        }))
        setProducts(transformedProducts)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) {
      return
    }

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete lead')
      }

      setLeads(prev => prev.filter(lead => lead.id !== leadId))
      alert('Lead deleted successfully')
    } catch (error) {
      console.error('Failed to delete lead:', error)
      alert('Failed to delete lead. Please try again.')
    }
  }

  const handleCopyReply = async (reply: string, leadId: string) => {
    try {
      await navigator.clipboard.writeText(reply)
      setCopiedReply(leadId)
      setTimeout(() => setCopiedReply(null), 2000)
    } catch (error) {
      console.error('Failed to copy reply:', error)
      alert('Failed to copy reply. Please try again.')
    }
  }

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update lead status')
      }

      // Update the lead in the local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus as any } : lead
      ))
    } catch (error) {
      console.error('Failed to update lead status:', error)
      alert('Failed to update lead status. Please try again.')
    }
  }


  const filteredLeads = leads.filter(lead => {
    const matchesFilter = filter === 'all' || lead.status === filter
    const matchesType = typeFilter === 'all' || lead.leadType === typeFilter
    const matchesSearch = searchTerm === '' || 
                          lead.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.subreddit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.productName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProduct = !selectedProduct || lead.productId === selectedProduct.id
    
    return matchesFilter && matchesType && matchesSearch && matchesProduct
  })

  // Debug logging
  console.log('Leads state:', leads.length)
  console.log('Filtered leads:', filteredLeads.length)
  console.log('Selected product:', selectedProduct?.id)
  console.log('Filter:', filter)
  console.log('Type filter:', typeFilter)
  console.log('Search term:', searchTerm)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'interested':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'not_interested':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Eye className="w-4 h-4" />
      case 'contacted':
        return <MessageSquare className="w-4 h-4" />
      case 'interested':
        return <CheckCircle className="w-4 h-4" />
      case 'not_interested':
        return <XCircle className="w-4 h-4" />
      default:
        return <Eye className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Target className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AccessGuard 
      feature="view_leads" 
      fallback={
        <AppLayout>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Trial Expired</h2>
              <p className="text-gray-600 mb-6">
                Your free trial has ended. Upgrade to Pro to continue accessing leads and unlock all features.
              </p>
              <UpgradeButton />
            </div>
          </div>
        </AppLayout>
      }
    >
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Leads Dashboard
                </h1>
                <p className="text-base sm:text-lg text-gray-600">
                  Discover and manage potential customers from Reddit discussions.
                </p>
              </div>
              
              {/* Reddit Connection Status */}
              <div className="flex items-center gap-2 sm:gap-3">
                {redditConnected ? (
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></div>
                    <span>Reddit Connected</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRedditConnectionModal(true)}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 transition-colors cursor-pointer"
                  >
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></div>
                    <span>Reddit Not Connected</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lead Statistics - Moved to top */}
          {leads.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Lead Statistics</h3>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {leads.filter(l => l.status === 'new').length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">New</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {leads.filter(l => l.status === 'contacted').length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Contacted</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {leads.filter(l => l.status === 'interested').length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Interested</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {leads.filter(l => l.status === 'not_interested').length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Not Interested</div>
                </div>
              </div>
            </div>
          )}

          {/* Products Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Products</h2>
              <button
                onClick={() => router.push('/products')}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Manage Products →
              </button>
            </div>
            
            {isLoadingProducts ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-6">
                  Add your first product to start finding leads on Reddit.
                </p>
                <button
                  onClick={() => router.push('/products')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Add Your First Product
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Show All Products Option */}
                <div 
                  className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    !selectedProduct 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => {
                    setSelectedProduct(null)
                    setCurrentPage(1)
                    fetchLeads(undefined, 1)
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">All Products</h3>
                      <p className="text-gray-600">View leads from all products</p>
                    </div>
                  </div>
                </div>
                
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedProduct?.id === product.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => {
                      setSelectedProduct(product)
                      setCurrentPage(1)
                      fetchLeads(product.id, 1)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 break-words leading-tight">{product.name}</h3>
                            {product.isFiltering && (
                              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex-shrink-0">
                                <Activity className="w-3 h-3" />
                                Filtering
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm break-words leading-relaxed mb-3">
                            {product.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                            <span>{product.subreddits.length} subreddits</span>
                            <span>•</span>
                            <span className="capitalize">{product.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      {redditConnected && (
                        <div className="flex gap-2 ml-4">
                          <div className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-xl">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Auto-discovering
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Product Info */}
          {selectedProduct && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Selected: {selectedProduct.name}
                  </h3>
                  <p className="text-blue-700">
                    Monitoring {selectedProduct.subreddits.length} subreddits: {selectedProduct.subreddits.slice(0, 3).join(', ')}
                    {selectedProduct.subreddits.length > 3 && ` +${selectedProduct.subreddits.length - 3} more`}
                  </p>
                </div>
                {selectedProduct.isFiltering && (
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      🔍 Filtering Active
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {['all', 'new', 'contacted'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 ${
                      filter === status
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {['all', 'post', 'comment'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type as any)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 ${
                      typeFilter === type
                        ? 'bg-green-100 text-green-700 border-2 border-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    {type === 'all' ? 'All Types' : type === 'post' ? '📝 Posts' : '💬 Comments'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Leads List */}
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {leads.length === 0 
                  ? 'No leads found yet. Lead discovery runs automatically for your products.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-200 flex-1 min-w-[350px] max-w-[500px]">
                  {/* Header with status and metadata */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                        {getStatusIcon(lead.status)}
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        lead.isComment ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {lead.isComment ? '💬' : '📝'}
                      </span>
                      <span className="text-xs text-gray-500">r/{lead.subreddit}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">u/{lead.author}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteLead(lead.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete lead"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title and content */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {lead.title}
                    </h3>
                    
                    {lead.isComment && lead.parentPostTitle && (
                      <div className="bg-gray-50 border-l-2 border-blue-400 rounded-r-lg p-3 mb-3">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Parent Post:</p>
                        <p className="text-sm text-gray-800 line-clamp-1">{lead.parentPostTitle}</p>
                      </div>
                    )}
                    
                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                      {lead.content}
                    </p>
                  </div>

                  {/* Metadata row */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {lead.comments}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {lead.productName}
                      </div>
                    </div>
                    {lead.aiAnalysisScore > 0 && (
                      <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-600" />
                        <span className="font-semibold text-purple-600">{lead.aiAnalysisScore}/10</span>
                      </div>
                    )}
                  </div>

                  {/* AI Analysis - Compact */}
                  {lead.aiAnalysisReasons.length > 0 && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                      <h4 className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        AI Analysis:
                      </h4>
                      <ul className="text-xs text-purple-800 space-y-1">
                        {lead.aiAnalysisReasons.slice(0, 3).map((reason, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                        {lead.aiAnalysisReasons.length > 3 && (
                          <li className="text-purple-600 text-xs">+{lead.aiAnalysisReasons.length - 3} more reasons</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* AI Sample Reply - Compact */}
                  {lead.aiSampleReply && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <h4 className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        AI Reply:
                      </h4>
                      <div className="text-xs text-green-800 bg-white p-2 rounded-lg border mb-2">
                        {lead.aiSampleReply}
                      </div>
                      <button
                        onClick={() => handleCopyReply(lead.aiSampleReply, lead.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {copiedReply === lead.id ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <span>📋</span>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="not_interested">Not Interested</option>
                      </select>
                    </div>
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Post
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 mt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results info */}
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalLeads)} of {pagination.totalLeads} leads
                </div>

                {/* Pagination controls */}
                <div className="flex items-center gap-2">
                  {/* Previous button */}
                  <button
                    onClick={() => {
                      if (pagination.hasPrevPage) {
                        const newPage = currentPage - 1
                        setCurrentPage(newPage)
                        fetchLeads(selectedProduct?.id, newPage)
                      }
                    }}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum)
                            fetchLeads(selectedProduct?.id, pageNum)
                          }}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Next button */}
                  <button
                    onClick={() => {
                      if (pagination.hasNextPage) {
                        const newPage = currentPage + 1
                        setCurrentPage(newPage)
                        fetchLeads(selectedProduct?.id, newPage)
                      }
                    }}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>

                {/* Leads per page selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Show:</label>
                  <select
                    value={leadsPerPage}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value)
                      setLeadsPerPage(newLimit)
                      setCurrentPage(1)
                      fetchLeads(selectedProduct?.id, 1, newLimit)
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Reddit Connection Modal */}
        {showRedditConnectionModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRedditConnectionModal(false)} />
              
              <div className="relative transform overflow-hidden rounded-3xl bg-white px-6 pb-6 pt-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-8">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
                    <svg className="h-8 w-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </div>
                  <div className="mt-6 text-center">
                    <h3 className="text-xl font-bold leading-6 text-gray-900 mb-4">
                      Connect Your Reddit Account
                    </h3>
                    <div className="mt-2">
                      <p className="text-gray-600">
                        To start finding leads, you need to connect your Reddit account. This allows us to search Reddit for relevant discussions about your products.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRedditConnectionModal(false)
                      window.location.href = '/api/auth/reddit'
                    }}
                    className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 sm:col-start-2"
                  >
                    Connect Reddit Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRedditConnectionModal(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors sm:col-start-1 sm:mt-0"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
    </AccessGuard>
  )
}

export default function Leads() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leads...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <LeadsContent />
    </Suspense>
  )
}