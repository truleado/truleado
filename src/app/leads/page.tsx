'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import AppLayout from '@/components/app-layout'
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
  Activity,
  Loader2,
  AlertCircle,
  Link,
  RefreshCw
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
  isUpdating?: boolean // Add loading state for individual products
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchProducts()
      fetchLeads()
      if (!redditConnectionChecked) {
        checkRedditConnection()
      }
    }
  }, [user, redditConnectionChecked])

  // Refresh Reddit connection status when page becomes visible (after OAuth redirect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && redditConnectionChecked) {
        checkRedditConnection()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, redditConnectionChecked])

  // Handle payment success parameter
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success')
    const sessionId = searchParams.get('session_id')
    
    if (paymentSuccess === 'true' && user && sessionId) {
      // Check payment status and update subscription
      const checkPaymentStatus = async () => {
        try {
          console.log('Checking payment status for session:', sessionId)
          const response = await fetch('/api/billing/check-payment-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              userId: user.id
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('Payment status check result:', result)
            
            if (result.success) {
              // Refresh subscription status after successful payment verification
              await refreshSubscription()
            }
          } else {
            console.error('Failed to check payment status')
          }
        } catch (error) {
          console.error('Error checking payment status:', error)
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

  // Add manual refresh button for debugging
  const handleManualRefresh = async () => {
    console.log('Manually refreshing subscription...')
    await refreshSubscription()
    console.log('Subscription refreshed')
  }

  const checkRedditConnection = async () => {
    try {
      const response = await fetch('/api/auth/reddit/status')
      if (response.ok) {
        const data = await response.json()
        setRedditConnected(data.connected)
        setRedditConnectionChecked(true)
        
        // If Reddit is not connected and user has products, show connection modal
        if (!data.connected && products.length > 0 && !showRedditConnectionModal) {
          setShowRedditConnectionModal(true)
        }
      }
    } catch (error) {
      console.error('Failed to check Reddit connection:', error)
      setRedditConnectionChecked(true)
    }
  }



  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
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
        // Transform database fields to match frontend interface
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

      // Remove the lead from local state
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

    const filteredLeads = leads.filter(lead => {
      const matchesFilter = filter === 'all' || lead.status === filter
      const matchesType = typeFilter === 'all' || lead.leadType === typeFilter
      const matchesSearch = searchTerm === '' || 
                            lead.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lead.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lead.subreddit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lead.productName.toLowerCase().includes(searchTerm.toLowerCase())
      
      // If a product is selected, only show leads for that product
      const matchesProduct = !selectedProduct || lead.productId === selectedProduct.id
      
      return matchesFilter && matchesType && matchesSearch && matchesProduct
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800'
      case 'interested':
        return 'bg-green-100 text-green-800'
      case 'not_interested':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Leads
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Discover and manage potential customers from Reddit discussions.
            </p>
          </div>
          
          {/* Reddit Connection Status */}
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            {redditConnected ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Reddit Connected</span>
              </div>
            ) : (
              <button
                onClick={() => setShowRedditConnectionModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Reddit Not Connected</span>
              </button>
            )}
            
            {/* Manual Refresh Button for Debugging */}
            <button
              onClick={handleManualRefresh}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer"
              title="Refresh subscription status"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Your Products</h2>
            <button
              onClick={() => router.push('/products')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Manage Products
            </button>
          </div>
          
          {isLoadingProducts ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add your first product to start finding leads on Reddit.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/products')}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Add Your First Product
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedProduct?.id === product.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                    {product.isFiltering && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Activity className="w-3 h-3" />
                        Filtering
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span>{product.subreddits.length} subreddits</span>
                    <span>•</span>
                    <span>{product.status}</span>
                  </div>
                  
                  {redditConnected && (
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Auto-discovering
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Product Info */}
        {selectedProduct && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  Selected: {selectedProduct.name}
                </h3>
                <p className="text-sm text-blue-700">
                  Monitoring {selectedProduct.subreddits.length} subreddits: {selectedProduct.subreddits.slice(0, 3).join(', ')}
                  {selectedProduct.subreddits.length > 3 && ` +${selectedProduct.subreddits.length - 3} more`}
                </p>
              </div>
              {selectedProduct.isFiltering && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    🔍 Filtering Active
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters and Filter */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter leads..."
                  value={searchTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'new', 'contacted', 'interested', 'not_interested'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === status
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {['all', 'post', 'comment'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type as any)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    typeFilter === type
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {leads.length === 0 
                ? 'Start searching for leads by selecting a product above and clicking "Start".'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusIcon(lead.status)}
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        lead.isComment ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.isComment ? '💬 Comment' : '📝 Post'}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">r/{lead.subreddit}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">u/{lead.author}</span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {lead.title}
                    </h3>
                    
                    {lead.isComment && lead.parentPostTitle && (
                      <div className="bg-gray-50 border-l-4 border-blue-400 p-3 mb-3">
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Parent Post:</strong>
                        </p>
                        <p className="text-sm text-gray-800 font-medium">
                          {lead.parentPostTitle}
                        </p>
                        {lead.parentPostUrl && (
                          <a 
                            href={lead.parentPostUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                          >
                            <Link className="w-3 h-3" />
                            View original post
                          </a>
                        )}
                      </div>
                    )}
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {lead.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {lead.comments} comments
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {lead.productName}
                      </div>
                      {lead.aiAnalysisScore > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-purple-600">
                            AI Score: {lead.aiAnalysisScore}/10
                          </span>
                        </div>
                      )}
                    </div>

                    {/* AI Analysis Section */}
                    {lead.aiAnalysisReasons.length > 0 && (
                      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="text-sm font-medium text-purple-900 mb-2">
                          🤖 AI Analysis - Why this is a good lead:
                        </h4>
                        <ul className="text-sm text-purple-800 space-y-1">
                          {lead.aiAnalysisReasons.map((reason, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-purple-600 mt-1">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* AI Sample Reply Section */}
                    {lead.aiSampleReply && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm font-medium text-green-900 mb-2">
                          💬 AI Suggested Reply:
                        </h4>
                        <div className="text-sm text-green-800 bg-white p-3 rounded border">
                          {lead.aiSampleReply}
                        </div>
                        <button
                          onClick={() => handleCopyReply(lead.aiSampleReply, lead.id)}
                          className="mt-2 inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          {copiedReply === lead.id ? (
                            <>
                              <span>✓</span>
                              Copied!
                            </>
                          ) : (
                            <>
                              <span>📋</span>
                              Copy Reply
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Post
                    </a>
                    
                    <div className="flex gap-1">
                      <button className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
                        Interested
                      </button>
                      <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        Not Interested
                      </button>
                      <UpgradeButton feature="delete_leads">
                        <button 
                          onClick={() => handleDeleteLead(lead.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </UpgradeButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {leads.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Statistics</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {leads.filter(l => l.status === 'new').length}
                </div>
                <div className="text-sm text-gray-500">New</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {leads.filter(l => l.status === 'contacted').length}
                </div>
                <div className="text-sm text-gray-500">Contacted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {leads.filter(l => l.status === 'interested').length}
                </div>
                <div className="text-sm text-gray-500">Interested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {leads.filter(l => l.status === 'not_interested').length}
                </div>
                <div className="text-sm text-gray-500">Not Interested</div>
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
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <svg className="h-6 w-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Connect Your Reddit Account
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      To start finding leads, you need to connect your Reddit account. This allows us to search Reddit for relevant discussions about your products.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRedditConnectionModal(false)
                    window.location.href = '/api/auth/reddit'
                  }}
                  className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 sm:col-start-2"
                >
                  Connect Reddit Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowRedditConnectionModal(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  )
}

export default function Leads() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#e6f4ff] to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#148cfc] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leads...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <LeadsContent />
    </Suspense>
  )
}