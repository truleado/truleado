'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import AppLayout from '@/components/app-layout'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { 
  Plus, 
  Package, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Globe,
  Target,
  CheckCircle,
  Zap,
  Users
} from 'lucide-react'
import { AccessGuard, UpgradeButton } from '@/components/AccessGuard'
import { useSubscription } from '@/lib/subscription-context'
import CustomModal from '@/components/CustomModal'

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
}

function ProductsContent() {
  const { user, loading } = useAuth()
  const { canAccess } = useSubscription()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({
    website: '',
    name: '',
    description: '',
    features: [] as string[],
    benefits: [] as string[],
    painPoints: [] as string[],
    idealCustomerProfile: '',
    subreddits: [] as string[],
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isFindingSubreddits, setIsFindingSubreddits] = useState(false)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false)
  const [addProductProgress, setAddProductProgress] = useState(0)
  
  // Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [showRedditSuccess, setShowRedditSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    } else if (!loading && user) {
      fetchProducts()
    }
  }, [user, loading, router])

  // Handle Reddit connection success
  useEffect(() => {
    const redditConnected = searchParams.get('reddit_connected')
    if (redditConnected === 'true') {
      setShowRedditSuccess(true)
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('reddit_connected')
      window.history.replaceState({}, '', url.toString())
      // Hide success message after 5 seconds
      setTimeout(() => setShowRedditSuccess(false), 5000)
    }
  }, [searchParams])

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
    }
  }

  const handleAnalyzeWebsite = async () => {
    if (!newProduct.website) return
    
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/products/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ website: newProduct.website }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze website')
      }

      const analysis = await response.json()
      
      setNewProduct(prev => ({
        ...prev,
        name: analysis.name,
        description: analysis.description,
        features: analysis.features,
        benefits: analysis.benefits,
        painPoints: analysis.painPoints,
        idealCustomerProfile: analysis.idealCustomerProfile,
      }))
    } catch (error) {
      console.error('Website analysis error:', error)
      // Show specific error message to user
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze website. Please try again.'
      alert(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFindSubreddits = async () => {
    setIsFindingSubreddits(true)
    
    try {
      const response = await fetch('/api/products/suggest-subreddits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          features: newProduct.features,
          benefits: newProduct.benefits,
          painPoints: newProduct.painPoints,
          idealCustomerProfile: newProduct.idealCustomerProfile,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to find subreddits')
      }

      const data = await response.json()
      
      setNewProduct(prev => ({
        ...prev,
        subreddits: data.subreddits,
      }))
    } catch (error) {
      console.error('Subreddit discovery error:', error)
      // Show error message to user
      alert('Failed to find subreddits. Please try again.')
    } finally {
      setIsFindingSubreddits(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProduct.name || !newProduct.website) {
      setModalTitle('Validation Error')
      setModalMessage('Product name and website are required')
      setShowErrorModal(true)
      return
    }

    setIsAddingProduct(true)
    setAddProductProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAddProductProgress(prev => {
          if (prev >= 90) return prev
          const increment = Math.random() * 15
          const newProgress = prev + increment
          return Math.min(newProgress, 90) // Cap at 90% until completion
        })
      }, 200)

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      })

      clearInterval(progressInterval)
      setAddProductProgress(100)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Product creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.error || 'Failed to create product')
      }

      const data = await response.json()
      
      // Transform the new product to match frontend interface
      const newProductData = {
        id: data.product.id,
        name: data.product.name,
        description: data.product.description,
        website: data.product.website_url,
        features: data.product.features || [],
        benefits: data.product.benefits || [],
        painPoints: data.product.pain_points || [],
        idealCustomerProfile: data.product.ideal_customer_profile || '',
        subreddits: data.product.subreddits || [],
        status: data.product.status,
        createdAt: data.product.created_at,
      }
      
      // Add the new product to the local state
      setProducts(prev => [newProductData, ...prev])
      
      // Close modal and reset form
      setShowAddModal(false)
      setNewProduct({
        website: '',
        name: '',
        description: '',
        features: [],
        benefits: [],
        painPoints: [],
        idealCustomerProfile: '',
        subreddits: [],
      })
      
      // Show success message based on lead discovery status
      setShowErrorModal(false) // Ensure error modal is closed
      if (data.leadDiscoveryStarted) {
        setModalTitle('Success')
        setModalMessage('Product added successfully! Lead discovery has started automatically.')
        setShowSuccessModal(true)
      } else {
        setModalTitle('Success')
        setModalMessage('Product added successfully! Connect your Reddit account to start finding leads.')
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('Product creation error:', error)
      setModalTitle('Error')
      setModalMessage('Failed to create product. Please try again.')
      setShowErrorModal(true)
    } finally {
      setIsAddingProduct(false)
      setAddProductProgress(0)
    }
  }

  const handleAddProductClick = () => {
    // Check if user can add more products
    if (!canAccess('add_products', products.length)) {
      setModalTitle('Upgrade Required')
      setModalMessage('You\'ve reached the limit of 1 product on your free trial. Upgrade to Pro to add unlimited products and unlock all features!')
      setShowUpgradeModal(true)
      return
    }
    
    setShowAddModal(true)
  }

  const handleDeleteProduct = (productId: string) => {
    setProductToDelete(productId)
    setModalTitle('Delete Product')
    setModalMessage('Are you sure you want to delete this product? This action cannot be undone.')
    setShowDeleteModal(true)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(`/api/products/${productToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      // Remove the product from local state
      setProducts(prev => prev.filter(product => product.id !== productToDelete))
      
      setModalTitle('Success')
      setModalMessage('Product deleted successfully!')
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Product deletion error:', error)
      setModalTitle('Error')
      setModalMessage('Failed to delete product. Please try again.')
      setShowErrorModal(true)
    } finally {
      setShowDeleteModal(false)
      setProductToDelete(null)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct({
      website: product.website,
      name: product.name,
      description: product.description,
      features: product.features,
      benefits: product.benefits,
      painPoints: product.painPoints,
      idealCustomerProfile: product.idealCustomerProfile,
      subreddits: product.subreddits,
    })
    setShowEditModal(true)
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingProduct || !newProduct.name || !newProduct.website) {
      alert('Product name and website are required')
      return
    }

    setIsUpdatingProduct(true)

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      })

      if (!response.ok) {
        throw new Error('Failed to update product')
      }

      const data = await response.json()
      
      // Update the product in local state
      setProducts(prev => prev.map(product => 
        product.id === editingProduct.id 
          ? {
              ...product,
              name: data.product.name,
              description: data.product.description,
              website: data.product.website_url,
              features: data.product.features || [],
              benefits: data.product.benefits || [],
              painPoints: data.product.pain_points || [],
              idealCustomerProfile: data.product.ideal_customer_profile || '',
              subreddits: data.product.subreddits || [],
            }
          : product
      ))
      
      // Close modal and reset form
      setShowEditModal(false)
      setEditingProduct(null)
      setNewProduct({
        website: '',
        name: '',
        description: '',
        features: [],
        benefits: [],
        painPoints: [],
        idealCustomerProfile: '',
        subreddits: [],
      })
      
      // Show success message
      setModalTitle('Success')
      setModalMessage('Product updated successfully!')
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Product update error:', error)
      setModalTitle('Error')
      setModalMessage('Failed to update product. Please try again.')
      setShowErrorModal(true)
    } finally {
      setIsUpdatingProduct(false)
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Products
                </h1>
                <p className="text-base sm:text-lg text-gray-600">
                  Manage your SaaS products and configure lead generation settings.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <UpgradeButton feature="add_products">
                  <button
                    onClick={handleAddProductClick}
                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    Add Product
                  </button>
                </UpgradeButton>
              </div>
            </div>
          </div>

          {/* Reddit Connection Success Message */}
          {showRedditSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-green-800">Reddit Connected Successfully!</h3>
                  <div className="mt-2 text-green-700">
                    <p>Your Reddit account has been connected. You can now add products to start finding leads on Reddit.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No products yet</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Get started by adding your first SaaS product. Our AI will analyze it and help you find relevant leads.
              </p>
              <UpgradeButton feature="add_products">
                <button
                  onClick={handleAddProductClick}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Product
                </button>
              </UpgradeButton>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="p-4 sm:p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4 sm:mb-6">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{product.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 font-medium">{product.status}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Main Content Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Left Column - Description and Basic Info */}
                      <div className="lg:col-span-1">
                        <div className="mb-3 sm:mb-4">
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{product.description}</p>
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                              <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                            </div>
                            <a href={product.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors font-medium truncate">
                              {product.website}
                            </a>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                            </div>
                            <span className="font-medium">{product.subreddits.length} subreddits monitored</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Column - AI Analysis Summary */}
                      <div className="lg:col-span-1">
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 h-full">
                          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                            <div>
                              <div className="flex items-center mb-1.5 sm:mb-2">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2">
                                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                                </div>
                                <span className="font-semibold text-gray-800 text-xs sm:text-sm">Key Features</span>
                              </div>
                              <div className="text-gray-600 space-y-0.5 sm:space-y-1">
                                {product.features.slice(0, 3).map((feature, idx) => (
                                  <div key={idx} className="truncate text-xs sm:text-sm">• {feature}</div>
                                ))}
                                {product.features.length > 3 && (
                                  <div className="text-gray-500 font-medium text-xs sm:text-sm">+{product.features.length - 3} more</div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex items-center mb-1.5 sm:mb-2">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2">
                                  <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600" />
                                </div>
                                <span className="font-semibold text-gray-800 text-xs sm:text-sm">Pain Points</span>
                              </div>
                              <div className="text-gray-600 space-y-0.5 sm:space-y-1">
                                {product.painPoints.slice(0, 3).map((point, idx) => (
                                  <div key={idx} className="truncate text-xs sm:text-sm">• {point}</div>
                                ))}
                                {product.painPoints.length > 3 && (
                                  <div className="text-gray-500 font-medium text-xs sm:text-sm">+{product.painPoints.length - 3} more</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Ideal Customer and Actions */}
                      <div className="lg:col-span-1">
                        <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 h-full">
                          <div className="flex items-start mb-3 sm:mb-4">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-gray-800 text-xs sm:text-sm">Ideal Customer:</span>
                              <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">{product.idealCustomerProfile}</p>
                            </div>
                          </div>
                          
                          <div className="mt-auto">
                            <div className="text-xs sm:text-sm text-gray-500 font-medium mb-2 sm:mb-3">
                              Created {new Date(product.createdAt).toLocaleDateString()}
                            </div>
                            <button className="w-full text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold hover:bg-blue-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Product Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-2 sm:p-4 text-center sm:items-center">
                <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowAddModal(false)} />
                
                <div className="relative transform overflow-hidden rounded-xl sm:rounded-2xl bg-white px-4 sm:px-6 pb-4 sm:pb-6 pt-4 sm:pt-6 text-left shadow-2xl transition-all sm:my-8 w-full max-w-2xl sm:p-8">
                  <div>
                    <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100">
                      <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                    <div className="mt-4 sm:mt-6 text-center">
                      <h3 className="text-xl sm:text-2xl font-bold leading-6 text-gray-900">
                        Analyze Your Product
                      </h3>
                      <div className="mt-2 sm:mt-3">
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                          Enter your website URL and our AI will analyze it to extract product details, features, benefits, and ideal customer profile.
                        </p>
                      </div>
                    </div>
                  </div>
                
                  <form onSubmit={handleAddProduct} className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
                    {/* Website URL Input */}
                    <div>
                      <label htmlFor="website" className="block text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        Website URL
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <input
                          type="url"
                          id="website"
                          value={newProduct.website}
                          onChange={(e) => setNewProduct({ ...newProduct, website: e.target.value })}
                          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base lg:text-lg"
                          placeholder="https://yourproduct.com"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleAnalyzeWebsite}
                          disabled={!newProduct.website || isAnalyzing}
                          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                        >
                          {isAnalyzing ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              {newProduct.website.includes('retry') ? 'Retrying...' : 'Analyzing...'}
                            </div>
                          ) : (
                            'Analyze'
                          )}
                        </button>
                      </div>
                      <p className="mt-3 text-gray-600">
                        Enter your website URL and click "Analyze" to automatically extract product details.
                      </p>
                    </div>

                    {/* Editable Product Details */}
                    {(newProduct.name || newProduct.description) && (
                      <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-bold text-gray-900">Product Details</h4>
                          <span className="text-sm text-gray-600 font-medium">Edit any field below</span>
                        </div>

                        {/* Product Name */}
                        <div>
                          <label className="block text-lg font-semibold text-gray-900 mb-2">
                            Product Name
                          </label>
                          <input
                            type="text"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter product name"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-lg font-semibold text-gray-900 mb-2">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Describe what your product does"
                          />
                        </div>

                        {/* Features */}
                        <div>
                          <label className="block text-lg font-semibold text-gray-900 mb-3">
                            Features
                          </label>
                          <div className="space-y-3">
                            {newProduct.features.map((feature, index) => (
                              <div key={index} className="flex gap-3">
                                <input
                                  type="text"
                                  value={feature}
                                  onChange={(e) => {
                                    const newFeatures = [...newProduct.features]
                                    newFeatures[index] = e.target.value
                                    setNewProduct({ ...newProduct, features: newFeatures })
                                  }}
                                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="Enter feature"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFeatures = newProduct.features.filter((_, i) => i !== index)
                                    setNewProduct({ ...newProduct, features: newFeatures })
                                  }}
                                  className="px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors font-semibold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setNewProduct({ ...newProduct, features: [...newProduct.features, ''] })}
                              className="text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                            >
                              + Add Feature
                            </button>
                          </div>
                        </div>

                        {/* Benefits */}
                        <div>
                          <label className="block text-lg font-semibold text-gray-900 mb-3">
                            Benefits
                          </label>
                          <div className="space-y-3">
                            {newProduct.benefits.map((benefit, index) => (
                              <div key={index} className="flex gap-3">
                                <input
                                  type="text"
                                  value={benefit}
                                  onChange={(e) => {
                                    const newBenefits = [...newProduct.benefits]
                                    newBenefits[index] = e.target.value
                                    setNewProduct({ ...newProduct, benefits: newBenefits })
                                  }}
                                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="Enter benefit"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newBenefits = newProduct.benefits.filter((_, i) => i !== index)
                                    setNewProduct({ ...newProduct, benefits: newBenefits })
                                  }}
                                  className="px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors font-semibold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setNewProduct({ ...newProduct, benefits: [...newProduct.benefits, ''] })}
                              className="text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                            >
                              + Add Benefit
                            </button>
                          </div>
                        </div>

                        {/* Pain Points */}
                        <div>
                          <label className="block text-lg font-semibold text-gray-900 mb-3">
                            Pain Points (Problems Solved)
                          </label>
                          <div className="space-y-3">
                            {newProduct.painPoints.map((point, index) => (
                              <div key={index} className="flex gap-3">
                                <input
                                  type="text"
                                  value={point}
                                  onChange={(e) => {
                                    const newPainPoints = [...newProduct.painPoints]
                                    newPainPoints[index] = e.target.value
                                    setNewProduct({ ...newProduct, painPoints: newPainPoints })
                                  }}
                                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="Enter pain point"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPainPoints = newProduct.painPoints.filter((_, i) => i !== index)
                                    setNewProduct({ ...newProduct, painPoints: newPainPoints })
                                  }}
                                  className="px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors font-semibold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setNewProduct({ ...newProduct, painPoints: [...newProduct.painPoints, ''] })}
                              className="text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                            >
                              + Add Pain Point
                            </button>
                          </div>
                        </div>

                        {/* Ideal Customer Profile */}
                        <div>
                          <label className="block text-lg font-semibold text-gray-900 mb-2">
                            Ideal Customer Profile
                          </label>
                          <textarea
                            rows={3}
                            value={newProduct.idealCustomerProfile}
                            onChange={(e) => setNewProduct({ ...newProduct, idealCustomerProfile: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Describe your ideal customer"
                          />
                        </div>

                        {/* Subreddits Section */}
                        <div className="border-t border-gray-200 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <label className="block text-lg font-semibold text-gray-900">
                              Relevant Subreddits
                            </label>
                            <button
                              type="button"
                              onClick={handleFindSubreddits}
                              disabled={isFindingSubreddits}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              {isFindingSubreddits ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Finding...
                                </div>
                              ) : (
                                'Find Subreddits'
                              )}
                            </button>
                          </div>
                          
                          {newProduct.subreddits.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {newProduct.subreddits.map((subreddit, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                >
                                  r/{subreddit}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSubreddits = newProduct.subreddits.filter((_, i) => i !== index)
                                      setNewProduct({ ...newProduct, subreddits: newSubreddits })
                                    }}
                                    className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-gray-600">
                            Click "Find Subreddits" to automatically discover relevant Reddit communities based on your product analysis.
                          </p>
                        </div>
                    </div>
                  )}
                    
                    {/* Progress Bar */}
                    {isAddingProduct && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between text-lg font-semibold text-gray-700 mb-3">
                          <span>Adding product...</span>
                          <span>{Math.round(addProductProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${addProductProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                      <button
                        type="submit"
                        disabled={isAddingProduct}
                        className="flex-1 inline-flex justify-center items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {isAddingProduct ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Adding...
                          </div>
                        ) : (
                          'Add Product'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        disabled={isAddingProduct}
                        className="flex-1 inline-flex justify-center items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                </form>
              </div>
            </div>
          </div>
        )}

          {/* Edit Product Modal */}
          {showEditModal && editingProduct && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowEditModal(false)} />
                
                <div className="relative transform overflow-hidden rounded-2xl bg-white px-6 pb-6 pt-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-8">
                  <div>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100">
                      <Edit className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="mt-6 text-center">
                      <h3 className="text-2xl font-bold leading-6 text-gray-900">
                        Edit Product
                      </h3>
                      <div className="mt-3">
                        <p className="text-lg text-gray-600">
                          Update your product details and configuration.
                        </p>
                      </div>
                    </div>
                  </div>
                
                  <form onSubmit={handleUpdateProduct} className="mt-8 space-y-8">
                    {/* Website URL Input */}
                    <div>
                      <label htmlFor="edit-website" className="block text-lg font-semibold text-gray-900 mb-3">
                        Website URL
                      </label>
                      <input
                        type="url"
                        id="edit-website"
                        value={newProduct.website}
                        onChange={(e) => setNewProduct({ ...newProduct, website: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                        placeholder="https://yourproduct.com"
                        required
                      />
                    </div>

                    {/* Product Name */}
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter product name"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-2">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Describe what your product does"
                      />
                    </div>

                    {/* Features */}
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Features
                      </label>
                      <div className="space-y-3">
                        {newProduct.features.map((feature, index) => (
                          <div key={index} className="flex gap-3">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => {
                                const newFeatures = [...newProduct.features]
                                newFeatures[index] = e.target.value
                                setNewProduct({ ...newProduct, features: newFeatures })
                              }}
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Enter feature"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newFeatures = newProduct.features.filter((_, i) => i !== index)
                                setNewProduct({ ...newProduct, features: newFeatures })
                              }}
                              className="px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors font-semibold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, features: [...newProduct.features, ''] })}
                          className="text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                        >
                          + Add Feature
                        </button>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Benefits
                      </label>
                      <div className="space-y-3">
                        {newProduct.benefits.map((benefit, index) => (
                          <div key={index} className="flex gap-3">
                            <input
                              type="text"
                              value={benefit}
                              onChange={(e) => {
                                const newBenefits = [...newProduct.benefits]
                                newBenefits[index] = e.target.value
                                setNewProduct({ ...newProduct, benefits: newBenefits })
                              }}
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Enter benefit"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newBenefits = newProduct.benefits.filter((_, i) => i !== index)
                                setNewProduct({ ...newProduct, benefits: newBenefits })
                              }}
                              className="px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors font-semibold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, benefits: [...newProduct.benefits, ''] })}
                          className="text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                        >
                          + Add Benefit
                        </button>
                      </div>
                    </div>

                    {/* Pain Points */}
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Pain Points (Problems Solved)
                      </label>
                      <div className="space-y-3">
                        {newProduct.painPoints.map((point, index) => (
                          <div key={index} className="flex gap-3">
                            <input
                              type="text"
                              value={point}
                              onChange={(e) => {
                                const newPainPoints = [...newProduct.painPoints]
                                newPainPoints[index] = e.target.value
                                setNewProduct({ ...newProduct, painPoints: newPainPoints })
                              }}
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Enter pain point"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newPainPoints = newProduct.painPoints.filter((_, i) => i !== index)
                                setNewProduct({ ...newProduct, painPoints: newPainPoints })
                              }}
                              className="px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors font-semibold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, painPoints: [...newProduct.painPoints, ''] })}
                          className="text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                        >
                          + Add Pain Point
                        </button>
                      </div>
                    </div>

                    {/* Ideal Customer Profile */}
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-2">
                        Ideal Customer Profile
                      </label>
                      <textarea
                        rows={3}
                        value={newProduct.idealCustomerProfile}
                        onChange={(e) => setNewProduct({ ...newProduct, idealCustomerProfile: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Describe your ideal customer"
                      />
                    </div>

                    {/* Subreddits Section */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-lg font-semibold text-gray-900">
                          Relevant Subreddits
                        </label>
                        <button
                          type="button"
                          onClick={handleFindSubreddits}
                          disabled={isFindingSubreddits}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          {isFindingSubreddits ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Finding...
                            </div>
                          ) : (
                            'Find Subreddits'
                          )}
                        </button>
                      </div>
                      
                      {newProduct.subreddits.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {newProduct.subreddits.map((subreddit, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              r/{subreddit}
                              <button
                                type="button"
                                onClick={() => {
                                  const newSubreddits = newProduct.subreddits.filter((_, i) => i !== index)
                                  setNewProduct({ ...newProduct, subreddits: newSubreddits })
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-gray-600">
                        Click "Find Subreddits" to automatically discover relevant Reddit communities based on your product analysis.
                      </p>
                    </div>
                    
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                      <button
                        type="submit"
                        disabled={isUpdatingProduct}
                        className="flex-1 inline-flex justify-center items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {isUpdatingProduct ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Updating...
                          </div>
                        ) : (
                          'Update Product'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        disabled={isUpdatingProduct}
                        className="flex-1 inline-flex justify-center items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                </form>
              </div>
            </div>
          </div>
          )}

          {/* Custom Modals */}
        <CustomModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title={modalTitle}
          message={modalMessage}
          type="warning"
          showCancel={true}
          confirmText="Upgrade Now"
          cancelText="Maybe Later"
          onConfirm={() => {
            setShowUpgradeModal(false)
            window.location.href = '/upgrade'
          }}
        />

        <CustomModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title={modalTitle}
          message={modalMessage}
          type="success"
          confirmText="OK"
        />

        <CustomModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title={modalTitle}
          message={modalMessage}
          type="error"
          confirmText="OK"
        />

        <CustomModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title={modalTitle}
          message={modalMessage}
          type="warning"
          showCancel={true}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteProduct}
        />
        </div>
      </div>
    </AppLayout>
  )
}

export default function Products() {
  return (
    <AccessGuard 
      feature="view_products" 
      fallback={
        <AppLayout>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Trial Expired</h2>
              <p className="text-gray-600 mb-6">
                Your free trial has ended. Upgrade to Pro to continue managing products and unlock all features.
              </p>
              <UpgradeButton />
            </div>
          </div>
        </AppLayout>
      }
    >
      <ProductsContent />
    </AccessGuard>
  )
}

