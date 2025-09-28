'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/lib/subscription-context'
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
  subreddit: string
  title: string
  body: string
  type: 'educational' | 'problem-solution' | 'community' | 'promotional'
}

export default function PromotePage() {
  const { user, loading: authLoading } = useAuth()
  const { canAccess, accessLevel, isLoading: subscriptionLoading } = useSubscription()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingPost, setEditingPost] = useState<{ subreddit: string; field: 'title' | 'body' } | null>(null)
  const [copiedPost, setCopiedPost] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  // Handle case where authentication is stuck loading (e.g., with dummy env vars)
  // Direct check for dummy environment variables to bypass authentication context issues
  if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://dummy.supabase.co' || 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy_anon_key') {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Megaphone className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access promotional tools.
            </p>
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

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
        setProducts([])
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
        setGeneratedPosts(data.posts)
      } else {
        console.error('Failed to generate posts')
      }
    } catch (error) {
      console.error('Error generating posts:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, postId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPost(postId)
      setTimeout(() => setCopiedPost(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const updatePost = (subreddit: string, field: 'title' | 'body', value: string) => {
    setGeneratedPosts(prev => 
      prev.map(post => 
        post.subreddit === subreddit 
          ? { ...post, [field]: value }
          : post
      )
    )
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'educational': return 'bg-blue-100 text-blue-800'
      case 'problem-solution': return 'bg-green-100 text-green-800'
      case 'community': return 'bg-purple-100 text-purple-800'
      case 'promotional': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || subscriptionLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Megaphone className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access promotional tools.
            </p>
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!canAccess('promote_products')) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Megaphone className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upgrade Required</h2>
            <p className="text-gray-600 mb-6">
              You need an active subscription to access promotional tools. Upgrade to Pro to generate promotional posts for your products.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/pricing'}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Star className="w-5 h-5 mr-2" />
                View Pricing
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Megaphone className="w-8 h-8 mr-3 text-blue-600" />
              Promote Your Products
            </h1>
            <p className="text-gray-600 mt-1">
              Generate creative promotional posts for Reddit communities
            </p>
          </div>
        </div>

        {/* Product Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Select Product
          </h2>
          
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No products found. Add a product first to generate promotional posts.</p>
              <a
                href="/products"
                className="inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                Go to Products
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value)
                  setSelectedProduct(product || null)
                  setGeneratedPosts([])
                }}
                className="input-base"
              >
                <option value="">Choose a product...</option>
                {Array.isArray(products) && products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{selectedProduct.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{selectedProduct.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-4">Website: {selectedProduct.website_url}</span>
                    <span>Target Subreddits: {selectedProduct.subreddits.length}</span>
                  </div>
                </div>
              )}

              {selectedProduct && (
                <button
                  onClick={generatePosts}
                  disabled={isGenerating}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Posts...
                    </>
                  ) : (
                    <>
                      <Megaphone className="w-4 h-4 mr-2" />
                      Generate Posts
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Generated Posts */}
        {generatedPosts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Generated Posts</h2>
            
            {generatedPosts.map((post, index) => (
              <div key={`${post.subreddit}-${index}`} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">r/{post.subreddit}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.type)}`}>
                      {post.type.replace('-', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${post.title}\n\n${post.body}`, `${post.subreddit}-${index}`)}
                    className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    {copiedPost === `${post.subreddit}-${index}` ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Post Title */}
                <div className="mb-4">
                  <label className="label-base">Post Title</label>
                  {editingPost?.subreddit === post.subreddit && editingPost?.field === 'title' ? (
                    <div className="space-y-2">
                      <textarea
                        value={post.title}
                        onChange={(e) => updatePost(post.subreddit, 'title', e.target.value)}
                        className="textarea-base"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingPost(null)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPost(null)}
                          className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-md">
                        {post.title}
                      </p>
                      <button
                        onClick={() => setEditingPost({ subreddit: post.subreddit, field: 'title' })}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Body */}
                <div>
                  <label className="label-base">Post Content</label>
                  {editingPost?.subreddit === post.subreddit && editingPost?.field === 'body' ? (
                    <div className="space-y-2">
                      <textarea
                        value={post.body}
                        onChange={(e) => updatePost(post.subreddit, 'body', e.target.value)}
                        className="textarea-base"
                        rows={8}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingPost(null)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPost(null)}
                          className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
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
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
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
    </AppLayout>
  )
}
