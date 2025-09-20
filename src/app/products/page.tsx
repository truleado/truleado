'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/app-layout'
import { 
  Plus, 
  Package, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Globe,
  Target
} from 'lucide-react'
import { AccessGuard, UpgradeButton } from '@/components/AccessGuard'
import { useSubscription } from '@/lib/subscription-context'

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

export default function Products() {
  const { user, loading } = useAuth()
  const { canAccess } = useSubscription()
  const router = useRouter()
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    } else if (!loading && user) {
      fetchProducts()
    }
  }, [user, loading, router])

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
      alert('Product name and website are required')
      return
    }

    setIsAddingProduct(true)
    setAddProductProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAddProductProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 20
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
        throw new Error('Failed to create product')
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
      if (data.leadDiscoveryStarted) {
        alert('Product added successfully! Lead discovery has started automatically.')
      } else {
        alert('Product added successfully! Connect your Reddit account to start finding leads.')
      }
    } catch (error) {
      console.error('Product creation error:', error)
      alert('Failed to create product. Please try again.')
    } finally {
      setIsAddingProduct(false)
      setAddProductProgress(0)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      // Remove the product from local state
      setProducts(prev => prev.filter(product => product.id !== productId))
      
      alert('Product deleted successfully!')
    } catch (error) {
      console.error('Product deletion error:', error)
      alert('Failed to delete product. Please try again.')
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
      alert('Product updated successfully!')
    } catch (error) {
      console.error('Product update error:', error)
      alert('Failed to update product. Please try again.')
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
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Products
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your SaaS products and configure lead generation settings.
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <UpgradeButton feature="add_products">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </button>
            </UpgradeButton>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first SaaS product.
            </p>
            <div className="mt-6">
              <UpgradeButton feature="add_products">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </button>
              </UpgradeButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.status}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <UpgradeButton feature="edit_products">
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </UpgradeButton>
                      <UpgradeButton feature="delete_products">
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </UpgradeButton>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Globe className="w-4 h-4 mr-2" />
                      <a href={product.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                        {product.website}
                      </a>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Target className="w-4 h-4 mr-2" />
                      {product.subreddits.length} subreddits
                    </div>
                  </div>

                  {/* AI Analysis Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Features:</span>
                        <div className="text-gray-600 mt-1">
                          {product.features.slice(0, 2).map((feature, idx) => (
                            <div key={idx} className="truncate">• {feature}</div>
                          ))}
                          {product.features.length > 2 && (
                            <div className="text-gray-500">+{product.features.length - 2} more</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Pain Points:</span>
                        <div className="text-gray-600 mt-1">
                          {product.painPoints.slice(0, 2).map((point, idx) => (
                            <div key={idx} className="truncate">• {point}</div>
                          ))}
                          {product.painPoints.length > 2 && (
                            <div className="text-gray-500">+{product.painPoints.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="font-medium text-gray-700">ICP:</span>
                      <span className="text-gray-600 ml-1">{product.idealCustomerProfile}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Created {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                    <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)} />
              
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      Analyze Your Product
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Enter your website URL and our AI will analyze it to extract product details, features, benefits, and ideal customer profile.
                      </p>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleAddProduct} className="mt-5 space-y-6">
                  {/* Website URL Input */}
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        id="website"
                        value={newProduct.website}
                        onChange={(e) => setNewProduct({ ...newProduct, website: e.target.value })}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="https://yourproduct.com"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleAnalyzeWebsite}
                        disabled={!newProduct.website || isAnalyzing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {isAnalyzing ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {newProduct.website.includes('retry') ? 'Retrying...' : 'Analyzing...'}
                          </div>
                        ) : (
                          'Analyze'
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Enter your website URL and click "Analyze" to automatically extract product details.
                    </p>
                  </div>

                  {/* Editable Product Details */}
                  {(newProduct.name || newProduct.description) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Product Details</h4>
                        <span className="text-xs text-gray-500">Edit any field below</span>
                      </div>

                      {/* Product Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter product name"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Describe what your product does"
                        />
                      </div>

                      {/* Features */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Features
                        </label>
                        <div className="space-y-2">
                          {newProduct.features.map((feature, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={feature}
                                onChange={(e) => {
                                  const newFeatures = [...newProduct.features]
                                  newFeatures[index] = e.target.value
                                  setNewProduct({ ...newProduct, features: newFeatures })
                                }}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Enter feature"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newFeatures = newProduct.features.filter((_, i) => i !== index)
                                  setNewProduct({ ...newProduct, features: newFeatures })
                                }}
                                className="px-2 py-1 text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setNewProduct({ ...newProduct, features: [...newProduct.features, ''] })}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            + Add Feature
                          </button>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Benefits
                        </label>
                        <div className="space-y-2">
                          {newProduct.benefits.map((benefit, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={benefit}
                                onChange={(e) => {
                                  const newBenefits = [...newProduct.benefits]
                                  newBenefits[index] = e.target.value
                                  setNewProduct({ ...newProduct, benefits: newBenefits })
                                }}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Enter benefit"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newBenefits = newProduct.benefits.filter((_, i) => i !== index)
                                  setNewProduct({ ...newProduct, benefits: newBenefits })
                                }}
                                className="px-2 py-1 text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setNewProduct({ ...newProduct, benefits: [...newProduct.benefits, ''] })}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            + Add Benefit
                          </button>
                        </div>
                      </div>

                      {/* Pain Points */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pain Points (Problems Solved)
                        </label>
                        <div className="space-y-2">
                          {newProduct.painPoints.map((point, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={point}
                                onChange={(e) => {
                                  const newPainPoints = [...newProduct.painPoints]
                                  newPainPoints[index] = e.target.value
                                  setNewProduct({ ...newProduct, painPoints: newPainPoints })
                                }}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Enter pain point"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newPainPoints = newProduct.painPoints.filter((_, i) => i !== index)
                                  setNewProduct({ ...newProduct, painPoints: newPainPoints })
                                }}
                                className="px-2 py-1 text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setNewProduct({ ...newProduct, painPoints: [...newProduct.painPoints, ''] })}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            + Add Pain Point
                          </button>
                        </div>
                      </div>

                      {/* Ideal Customer Profile */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ideal Customer Profile
                        </label>
                        <textarea
                          rows={2}
                          value={newProduct.idealCustomerProfile}
                          onChange={(e) => setNewProduct({ ...newProduct, idealCustomerProfile: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Describe your ideal customer"
                        />
                      </div>

                      {/* Subreddits Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Relevant Subreddits
                          </label>
                          <button
                            type="button"
                            onClick={handleFindSubreddits}
                            disabled={isFindingSubreddits}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {isFindingSubreddits ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Finding...
                              </div>
                            ) : (
                              'Find Subreddits'
                            )}
                          </button>
                        </div>
                        
                        {newProduct.subreddits.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {newProduct.subreddits.map((subreddit, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                r/{subreddit}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSubreddits = newProduct.subreddits.filter((_, i) => i !== index)
                                    setNewProduct({ ...newProduct, subreddits: newSubreddits })
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-500">
                          Click "Find Subreddits" to automatically discover relevant Reddit communities based on your product analysis.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Progress Bar */}
                  {isAddingProduct && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Adding product...</span>
                        <span>{Math.round(addProductProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${addProductProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={isAddingProduct}
                      className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingProduct ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)} />
              
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Edit className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      Edit Product
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Update your product details and configuration.
                      </p>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleUpdateProduct} className="mt-5 space-y-6">
                  {/* Website URL Input */}
                  <div>
                    <label htmlFor="edit-website" className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      id="edit-website"
                      value={newProduct.website}
                      onChange={(e) => setNewProduct({ ...newProduct, website: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="https://yourproduct.com"
                      required
                    />
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Describe what your product does"
                    />
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Features
                    </label>
                    <div className="space-y-2">
                      {newProduct.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...newProduct.features]
                              newFeatures[index] = e.target.value
                              setNewProduct({ ...newProduct, features: newFeatures })
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter feature"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newFeatures = newProduct.features.filter((_, i) => i !== index)
                              setNewProduct({ ...newProduct, features: newFeatures })
                            }}
                            className="px-2 py-1 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, features: [...newProduct.features, ''] })}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Feature
                      </button>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Benefits
                    </label>
                    <div className="space-y-2">
                      {newProduct.benefits.map((benefit, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => {
                              const newBenefits = [...newProduct.benefits]
                              newBenefits[index] = e.target.value
                              setNewProduct({ ...newProduct, benefits: newBenefits })
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter benefit"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newBenefits = newProduct.benefits.filter((_, i) => i !== index)
                              setNewProduct({ ...newProduct, benefits: newBenefits })
                            }}
                            className="px-2 py-1 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, benefits: [...newProduct.benefits, ''] })}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Benefit
                      </button>
                    </div>
                  </div>

                  {/* Pain Points */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pain Points (Problems Solved)
                    </label>
                    <div className="space-y-2">
                      {newProduct.painPoints.map((point, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => {
                              const newPainPoints = [...newProduct.painPoints]
                              newPainPoints[index] = e.target.value
                              setNewProduct({ ...newProduct, painPoints: newPainPoints })
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter pain point"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPainPoints = newProduct.painPoints.filter((_, i) => i !== index)
                              setNewProduct({ ...newProduct, painPoints: newPainPoints })
                            }}
                            className="px-2 py-1 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, painPoints: [...newProduct.painPoints, ''] })}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Pain Point
                      </button>
                    </div>
                  </div>

                  {/* Ideal Customer Profile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ideal Customer Profile
                    </label>
                    <textarea
                      rows={2}
                      value={newProduct.idealCustomerProfile}
                      onChange={(e) => setNewProduct({ ...newProduct, idealCustomerProfile: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Describe your ideal customer"
                    />
                  </div>

                  {/* Subreddits Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Relevant Subreddits
                      </label>
                      <button
                        type="button"
                        onClick={handleFindSubreddits}
                        disabled={isFindingSubreddits}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {isFindingSubreddits ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Finding...
                          </div>
                        ) : (
                          'Find Subreddits'
                        )}
                      </button>
                    </div>
                    
                    {newProduct.subreddits.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {newProduct.subreddits.map((subreddit, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            r/{subreddit}
                            <button
                              type="button"
                              onClick={() => {
                                const newSubreddits = newProduct.subreddits.filter((_, i) => i !== index)
                                setNewProduct({ ...newProduct, subreddits: newSubreddits })
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500">
                      Click "Find Subreddits" to automatically discover relevant Reddit communities based on your product analysis.
                    </p>
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={isUpdatingProduct}
                      className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingProduct ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

