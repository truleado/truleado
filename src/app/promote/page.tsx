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

    setIsGenerating(true)
    try {
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
          targetSubreddits: selectedProduct.subreddits,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newPosts = data.posts || []
        
        // Save each new post to the database
        const savedPosts = []
        for (const post of newPosts) {
          try {
            const saveResponse = await fetch('/api/promoted-posts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                product_id: selectedProduct.id,
                subreddit: post.subreddit,
                title: post.title,
                body: post.body,
                post_type: post.type
              }),
            })
            
            if (saveResponse.ok) {
              const savedPost = await saveResponse.json()
              savedPosts.push(savedPost.post)
            } else {
              console.error('Failed to save post to database:', post.title)
              // Still add to UI even if database save fails
              savedPosts.push({ ...post, id: `temp-${Date.now()}-${Math.random()}` })
            }
          } catch (error) {
            console.error('Error saving post to database:', error)
            // Still add to UI even if database save fails
            savedPosts.push({ ...post, id: `temp-${Date.now()}-${Math.random()}` })
          }
        }
        
        // Add new posts to existing ones
        setGeneratedPosts(prev => {
          const updatedPosts = [...prev, ...savedPosts]
          setMaxPostsReached(updatedPosts.length >= 50)
          return updatedPosts
        })
      } else {
        console.error('Failed to generate posts')
      }
    } catch (error) {
      console.error('Error generating posts:', error)
    } finally {
      setIsGenerating(false)
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
    setGeneratedPosts(prev => 
      prev.map((post, index) => 
        index === postIndex ? { ...post, [field]: value } : post
      )
    )
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                  <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
                  Promote Your Products
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Generate creative promotional posts for Reddit communities
                </p>
              </div>
              <button
                onClick={forceRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 self-start sm:self-auto"
              >
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Refresh Status
              </button>
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
                      setGeneratedPosts([])
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
                              Generating...
                            </>
                          ) : (
                            <>
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                              Generate Posts
                            </>
                          )}
                        </button>
                        
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
                    <div className="text-sm text-gray-500">
                      Posts persist after page refresh
                    </div>
                  </h2>
                </div>
                
                {generatedPosts.map((post, index) => (
                  <div key={index} className="p-6 border-b border-gray-200 last:border-b-0">
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          r/{post.subreddit}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(post.type)}`}>
                          {post.type.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(`${post.title}\n\n${post.body}`, index)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy post"
                        >
                          {copiedPost === `${index}-${post.title.substring(0, 20)}` ? (
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
                            value={post.title}
                            onChange={(e) => setGeneratedPosts(prev => 
                              prev.map((p, i) => i === index ? { ...p, title: e.target.value } : p)
                            )}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveEdit(index, 'title', post.title)}
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
                            {post.title}
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
                            value={post.body}
                            onChange={(e) => setGeneratedPosts(prev => 
                              prev.map((p, i) => i === index ? { ...p, body: e.target.value } : p)
                            )}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={6}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveEdit(index, 'body', post.body)}
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
                            {post.body}
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