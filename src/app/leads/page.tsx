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
  const [copiedReply, setCopiedReply] = useState<string | null>(null)

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
    }
  }, [user])

  // Auto-select first product when products are loaded
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      console.log('Auto-selecting first product:', products[0].name)
      setSelectedProduct(products[0])
      fetchLeads(products[0].id)
    }
  }, [products, selectedProduct])


  const fetchLeads = async (productId?: string) => {
    try {
      console.log('Fetching leads for product:', productId || 'all')
      
      // Only fetch leads if a specific product is selected
      if (!productId) {
        setLeads([])
        return
      }
      
      const params = new URLSearchParams()
      params.append('productId', productId)
      
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
                    fetchLeads(undefined)
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
                      fetchLeads(product.id)
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
                      
                      <div className="flex gap-2 ml-4">
                        <div className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-xl">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Auto-discovering
                        </div>
                      </div>
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
          {!selectedProduct ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a Product to View Leads
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Choose a product from the list above to see all discovered leads for that product.
              </p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {leads.length === 0 
                  ? 'No leads found yet for this product. Lead discovery runs automatically for your products.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div>
              {/* Leads count and info */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      All Leads for {selectedProduct.name}
                    </h3>
                    <p className="text-gray-600">
                      Showing {filteredLeads.length} of {leads.length} leads
                      {filteredLeads.length !== leads.length && ' (filtered)'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {leads.length}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Leads
                    </div>
                  </div>
                </div>
              </div>

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
            </div>
          )}


        </div>

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