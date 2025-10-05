'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/lib/subscription-context'
import { AccessGuard, UpgradeButton } from '@/components/AccessGuard'
import AppLayout from '@/components/app-layout'
import { Megaphone, Package, Copy, Edit3, Check, Loader2, ExternalLink, Star } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Product {
  id: string
  name: string
  description: string
  website_url: string
  subreddits: string[]
  features?: string[]
  benefits?: string[]
  pain_points?: string[]
  ideal_customer_profile?: string
  created_at: string
}

interface GeneratedPost {
  id?: string
  subreddit: string
  title: string
  body: string
  type: 'educational' | 'problem-solution' | 'community' | 'promotional'
  product_id?: string
  created_at?: string
  updated_at?: string
}

export default function PromotePage() {
  const { user, loading: authLoading } = useAuth()
  const { canAccess, accessLevel, isLoading: subscriptionLoading, forceRefresh } = useSubscription()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingPost, setEditingPost] = useState<{ subreddit: string; field: 'title' | 'body' } | null>(null)
  const [copiedPost, setCopiedPost] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [maxPostsReached, setMaxPostsReached] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, currentSubreddit: '' })
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generationAbortController, setGenerationAbortController] = useState<AbortController | null>(null)

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth/signin'
    }
  }, [user, authLoading])

  // Show loading while authentication is in progress
  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!user) {
    return null
  }

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('PromotePage Debug:', {
      user: !!user,
      authLoading,
      subscriptionLoading,
      accessLevel,
      canAccessPromote: canAccess('promote_products'),
      productsCount: products.length
    })
  }

  // Load saved posts from database on component mount
  useEffect(() => {
    if (user) {
      fetchPromotedPosts()
    }
  }, [user])

  // Fetch promoted posts from database
  const fetchPromotedPosts = async () => {
    try {
      const response = await fetch('/api/promoted-posts')
      if (response.ok) {
        const data = await response.json()
        const posts = data.posts || []
        setGeneratedPosts(posts)
        setMaxPostsReached(posts.length >= 50)
      } else {
        console.error('Failed to fetch promoted posts:', response.status)
        // Fallback to localStorage for development
        const savedPosts = localStorage.getItem('truleado-generated-posts')
        if (savedPosts) {
          try {
            const parsedPosts = JSON.parse(savedPosts)
            setGeneratedPosts(parsedPosts)
            setMaxPostsReached(parsedPosts.length >= 50)
          } catch (error) {
            console.error('Failed to parse saved posts:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching promoted posts:', error)
      // Fallback to localStorage for development
      const savedPosts = localStorage.getItem('truleado-generated-posts')
      if (savedPosts) {
        try {
          const parsedPosts = JSON.parse(savedPosts)
          setGeneratedPosts(parsedPosts)
          setMaxPostsReached(parsedPosts.length >= 50)
        } catch (error) {
          console.error('Failed to parse saved posts:', error)
        }
      }
    }
  }

  useEffect(() => {
    // Always fetch products to keep it simple
    console.log('PromotePage useEffect - calling fetchProducts')
    fetchProducts()
  }, [])


  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        // The API returns { products: [...] }, so we need to extract the products array
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products)
        } else {
          console.error('Products data is not in expected format:', data)
          setProducts([])
        }
      } else {
        console.error('Failed to fetch products:', response.status)
        // For development with dummy env vars, show a helpful message
        if (response.status === 401) {
          setProducts([])
        } else {
          setProducts([])
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const generatePosts = async () => {
    if (!selectedProduct) return

    // Check if we've reached the maximum number of posts
    if (generatedPosts.length >= 50) {
      setMaxPostsReached(true)
      return
    }

    // Clear any previous errors
    setGenerationError(null)
    
    // Check if posts already exist for this product
    const existingPostsForProduct = generatedPosts.filter(post => 
      post.product_id === selectedProduct.id
    )
    
    if (existingPostsForProduct.length > 0) {
      const confirmGenerate = window.confirm(
        `You already have ${existingPostsForProduct.length} posts for this product. Do you want to generate more?`
      )
      if (!confirmGenerate) return
    }

    // Create abort controller for stopping generation
    const abortController = new AbortController()
    setGenerationAbortController(abortController)

    setIsGenerating(true)
    setGenerationProgress({ current: 0, total: 0, currentSubreddit: 'Analyzing product and detecting subreddits...' })
    setGenerationError(null)
    
    try {
      // Generate high-quality posts with AI-powered subreddit detection
      const response = await fetch('/api/promote/generate-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productDescription: selectedProduct.description,
          websiteUrl: selectedProduct.website_url,
          variation: 0
        }),
        signal: abortController.signal
      })

      if (response.ok) {
        const data = await response.json()
        const newPosts = data.posts || []
        
        console.log(`Generated ${newPosts.length} high-quality posts for AI-detected subreddits`)
        
        // Update progress to show completion
        setGenerationProgress({ current: newPosts.length, total: newPosts.length, currentSubreddit: 'Complete' })
        
        // Save all posts to database and add to UI
        for (let i = 0; i < newPosts.length; i++) {
          // Check if generation was aborted
          if (abortController.signal.aborted) {
            console.log('Generation aborted by user')
            return
          }
          
          const post = newPosts[i]
          setGenerationProgress(prev => ({ 
            ...prev, 
            current: i + 1,
            currentSubreddit: `Saving high-quality post for r/${post.subreddit}...`
          }))
          
          try {
            const saveResponse = await fetch('/api/promoted-posts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                product_id: selectedProduct.id,
                subreddit: post.subreddit || 'unknown',
                title: post.title || 'Untitled',
                body: post.body || 'No content',
                post_type: post.type || 'promotional'
              }),
              signal: abortController.signal
            })
            
            if (saveResponse.ok) {
              const savedPost = await saveResponse.json()
              
              // Add post immediately to UI (streaming)
              setGeneratedPosts(prev => {
                const updatedPosts = [...prev, savedPost.post]
                setMaxPostsReached(updatedPosts.length >= 50)
                
                // Save to localStorage as backup
                try {
                  localStorage.setItem('truleado-generated-posts', JSON.stringify(updatedPosts))
                } catch (error) {
                  console.warn('Failed to save posts to localStorage:', error)
                }
                
                return updatedPosts
              })
            } else {
              console.error('Failed to save post to database:', post.title)
              // Still add to UI even if database save fails
              const tempPost = { ...post, id: `temp-${Date.now()}-${Math.random()}` }
              setGeneratedPosts(prev => [...prev, tempPost])
            }
          } catch (error) {
            console.error('Error saving post to database:', error)
            // Still add to UI even if database save fails
            const tempPost = { ...post, id: `temp-${Date.now()}-${Math.random()}` }
            setGeneratedPosts(prev => [...prev, tempPost])
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to generate posts'
        console.error('Failed to generate posts:', errorMessage)
        setGenerationError(errorMessage)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Generation aborted by user')
        return
      }
      console.error('Error generating posts:', error)
      setGenerationError('AI generation failed. Please check your internet connection and try again later.')
    } finally {
      setIsGenerating(false)
      setGenerationProgress({ current: 0, total: 0, currentSubreddit: '' })
      setGenerationAbortController(null)
    }
  }

  const deletePost = async (postIndex: number) => {
    const postToDelete = generatedPosts[postIndex]
    
    // If the post has a real ID (not temp), delete from database
    if (postToDelete.id && !postToDelete.id.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/promoted-posts/${postToDelete.id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          console.error('Failed to delete post from database')
        }
      } catch (error) {
        console.error('Error deleting post from database:', error)
      }
    }
    
    // Update UI regardless of database success
    setGeneratedPosts(prev => {
      const newPosts = prev.filter((_, index) => index !== postIndex)
      setMaxPostsReached(newPosts.length >= 50)
      
      // Update localStorage
      try {
        localStorage.setItem('truleado-generated-posts', JSON.stringify(newPosts))
      } catch (error) {
        console.warn('Failed to update localStorage:', error)
      }
      
      return newPosts
    })
  }

  const clearAllPosts = async () => {
    // Delete all posts from database
    const postsToDelete = generatedPosts.filter(post => post.id && !post.id.startsWith('temp-'))
    
    for (const post of postsToDelete) {
      try {
        const response = await fetch(`/api/promoted-posts/${post.id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          console.error('Failed to delete post from database:', post.id)
        }
      } catch (error) {
        console.error('Error deleting post from database:', error)
      }
    }
    
    // Clear UI and localStorage
    setGeneratedPosts([])
    setMaxPostsReached(false)
    localStorage.removeItem('truleado-generated-posts')
  }

  const stopGeneration = () => {
    if (generationAbortController) {
      generationAbortController.abort()
      setGenerationAbortController(null)
    }
    setIsGenerating(false)
    setGenerationProgress({ current: 0, total: 0, currentSubreddit: '' })
    setGenerationError(null)
  }


  const copyToClipboard = async (text: string, postIndex: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPost(`${postIndex}-${text.substring(0, 20)}`)
      setTimeout(() => setCopiedPost(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const saveEdit = async (postIndex: number, field: 'title' | 'body', value: string) => {
    const postToUpdate = generatedPosts[postIndex]
    
    // Update UI immediately
    setGeneratedPosts(prev => {
      const updatedPosts = prev.map((post, index) => 
        index === postIndex ? { ...post, [field]: value } : post
      )
      
      // Update localStorage
      try {
        localStorage.setItem('truleado-generated-posts', JSON.stringify(updatedPosts))
      } catch (error) {
        console.warn('Failed to update localStorage:', error)
      }
      
      return updatedPosts
    })
    setEditingPost(null)
    
    // If the post has a real ID (not temp), save to database
    if (postToUpdate.id && !postToUpdate.id.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/promoted-posts/${postToUpdate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: field === 'title' ? value : postToUpdate.title,
            body: field === 'body' ? value : postToUpdate.body,
          }),
        })
        
        if (!response.ok) {
          console.error('Failed to update post in database')
        }
      } catch (error) {
        console.error('Error updating post in database:', error)
      }
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'educational': return 'bg-blue-100 text-blue-800'
      case 'problem-solution': return 'bg-green-100 text-green-800'
      case 'community': return 'bg-purple-100 text-purple-800'
      case 'promotional': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AccessGuard 
      feature="promote_products" 
      fallback={
        <AppLayout>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Megaphone className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Trial Expired</h2>
              <p className="text-gray-600 mb-6">
                Your free trial has ended. Upgrade to Pro to continue generating promotional posts and unlock all features.
              </p>
              <UpgradeButton />
            </div>
          </div>
        </AppLayout>
      }
    >
      <AppLayout>
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
                Promote Your Products
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Generate creative promotional posts for Reddit communities
              </p>
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                Select Product
              </h2>
              
              {products.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">No products found. Add a product first to generate promotional posts.</p>
                  <a
                    href="/products"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm sm:text-base"
                  >
                    Go to Products
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </a>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <select
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const product = products.find(p => p.id === e.target.value)
                      setSelectedProduct(product || null)
                      // Don't clear generated posts when switching products - they should persist
                    }}
                    className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <option value="">Choose a product...</option>
                    {Array.isArray(products) && products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>

                  {selectedProduct && (
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <h3 className="font-medium text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{selectedProduct.name}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">{selectedProduct.description}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 gap-1 sm:gap-4">
                        <span className="truncate">Website: {selectedProduct.website_url}</span>
                        <span>Target Subreddits: {selectedProduct.subreddits.length}</span>
                      </div>
                      
                      {selectedProduct.subreddits.length === 0 && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-amber-800">
                                No Subreddits Configured
                              </h3>
                              <div className="mt-1 text-sm text-amber-700">
                                <p>This product needs subreddits configured to generate posts. Please edit the product to add subreddits.</p>
                              </div>
                              <div className="mt-2">
                                <a
                                  href="/products"
                                  className="text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                                >
                                  Go to Products to Edit →
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <button
                          onClick={generatePosts}
                          disabled={isGenerating || maxPostsReached}
                          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                              AI Generating...
                            </>
                          ) : (
                            <>
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                              Generate AI Posts
                            </>
                          )}
                        </button>
                        
                        {isGenerating && generationProgress.total > 0 && (
                          <div className="w-full mt-3">
                            <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                              <span>AI analyzing product and generating high-quality posts...</span>
                              <div className="flex items-center space-x-2">
                                <span>{generationProgress.current}/{generationProgress.total}</span>
                                <button
                                  onClick={stopGeneration}
                                  className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded text-xs font-medium transition-colors"
                                >
                                  Stop
                                </button>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                              ></div>
                            </div>
                            {generationProgress.currentSubreddit && (
                              <div className="text-xs text-gray-500 mt-1">
                                Currently generating for: r/{generationProgress.currentSubreddit}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {Math.round((generationProgress.current / generationProgress.total) * 100)}% complete
                            </div>
                          </div>
                        )}
                        
                        {generationError && (
                          <div className="w-full mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                  AI Generation Failed
                                </h3>
                                <div className="mt-1 text-sm text-red-700">
                                  <p>{generationError}</p>
                                </div>
                                <div className="mt-2">
                                  <button
                                    onClick={() => setGenerationError(null)}
                                    className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {generatedPosts.length > 0 && (
                          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                            {generatedPosts.length}/50 posts generated
                          </div>
                        )}
                      </div>
                      
                      {generatedPosts.length > 0 && (
                        <button
                          onClick={clearAllPosts}
                          className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium self-center sm:self-auto"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generated Posts */}
            {generatedPosts.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Generated Posts
                  </h2>
                </div>
                
                {generatedPosts.map((post, index) => (
                  <div key={index} className="p-6 border-b border-gray-200 last:border-b-0">
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          r/{post.subreddit || 'unknown'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(post.type || 'promotional')}`}>
                          {(post.type || 'promotional').replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(`${post.title || 'Untitled'}\n\n${post.body || 'No content'}`, index)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy post"
                        >
                          {copiedPost === `${index}-${(post.title || 'Untitled').substring(0, 20)}` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deletePost(index)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete post"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Post Title */}
                    <div className="mb-4">
                      {editingPost?.subreddit === post.subreddit && editingPost?.field === 'title' ? (
                        <div className="space-y-2">
                          <textarea
                            value={post.title || ''}
                            onChange={(e) => setGeneratedPosts(prev => 
                              prev.map((p, i) => i === index ? { ...p, title: e.target.value } : p)
                            )}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveEdit(index, 'title', post.title || '')}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPost(null)}
                              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <h3 className="text-lg font-semibold text-gray-900 pr-8">
                            {post.title || 'Untitled'}
                          </h3>
                          <button
                            onClick={() => setEditingPost({ subreddit: post.subreddit, field: 'title' })}
                            className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit title"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Post Body */}
                    <div>
                      {editingPost?.subreddit === post.subreddit && editingPost?.field === 'body' ? (
                        <div className="space-y-2">
                          <textarea
                            value={post.body || ''}
                            onChange={(e) => setGeneratedPosts(prev => 
                              prev.map((p, i) => i === index ? { ...p, body: e.target.value } : p)
                            )}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={6}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveEdit(index, 'body', post.body || '')}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPost(null)}
                              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="text-gray-700 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                            {post.body || 'No content available'}
                          </div>
                          <button
                            onClick={() => setEditingPost({ subreddit: post.subreddit, field: 'body' })}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit body"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AppLayout>
    </AccessGuard>
  )
}