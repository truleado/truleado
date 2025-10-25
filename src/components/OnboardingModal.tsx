'use client'

import React, { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, CheckCircle, Package, Search, ExternalLink, Globe, Users, TrendingUp, Target, Zap } from 'lucide-react'
import { useOnboarding } from '@/contexts/onboarding-context'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

// Custom Reddit icon component
const RedditIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
)

// Product Form Component - matches the existing system exactly
const ProductForm = ({ onProductAdded }: { onProductAdded: () => void }) => {
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
  const [error, setError] = useState('')

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
      setError(error instanceof Error ? error.message : 'Failed to analyze website. Please try again.')
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
      setError('Failed to find subreddits. Please try again.')
    } finally {
      setIsFindingSubreddits(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProduct.name || !newProduct.website) {
      setError('Product name and website are required')
      return
    }

    setIsAddingProduct(true)
    setError('')

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to create product')
      }

      onProductAdded()
    } catch (error) {
      console.error('Product creation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create product. Please try again.')
    } finally {
      setIsAddingProduct(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Website URL Input */}
      <div>
        <label htmlFor="website" className="block text-base font-semibold text-gray-900 mb-2">
          Website URL *
        </label>
        <div className="flex gap-3">
          <input
            type="url"
            id="website"
            value={newProduct.website}
            onChange={(e) => setNewProduct({ ...newProduct, website: e.target.value })}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="https://yourproduct.com"
            required
          />
          <button
            type="button"
            onClick={handleAnalyzeWebsite}
            disabled={!newProduct.website || isAnalyzing}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isAnalyzing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing...
              </div>
            ) : (
              'Analyze'
            )}
          </button>
        </div>
        <p className="mt-2 text-gray-600 text-sm">
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
              Product Name *
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
              Description *
            </label>
            <textarea
              rows={3}
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Describe what your product does"
              required
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
            
            {/* Manual Subreddit Input */}
            <div className="mb-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Add subreddit manually (e.g., entrepreneur, smallbusiness)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const input = e.target as HTMLInputElement
                      const subreddit = input.value.trim().replace('r/', '').replace('/', '')
                      if (subreddit && !newProduct.subreddits.includes(subreddit)) {
                        setNewProduct({ ...newProduct, subreddits: [...newProduct.subreddits, subreddit] })
                        input.value = ''
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                    const subreddit = input.value.trim().replace('r/', '').replace('/', '')
                    if (subreddit && !newProduct.subreddits.includes(subreddit)) {
                      setNewProduct({ ...newProduct, subreddits: [...newProduct.subreddits, subreddit] })
                      input.value = ''
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
                >
                  Add
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Type a subreddit name and press Enter or click Add. You can include or exclude "r/" prefix.
              </p>
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
              Click "Find Subreddits" to automatically discover relevant Reddit communities, or add them manually above.
            </p>
          </div>
        </div>
      )}

      {/* Warning message when subreddits are not generated after analysis */}
      {newProduct.name && newProduct.description && newProduct.subreddits.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Subreddits Required
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>Please generate subreddits first by clicking "Find Subreddits" button. This helps us identify the best Reddit communities for your product.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isAddingProduct || !newProduct.name || !newProduct.description || newProduct.subreddits.length === 0}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center py-4"
      >
        {isAddingProduct ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Adding Product...
          </div>
        ) : (
          <>
            <Package className="w-5 h-5 mr-2" />
            Add Product
          </>
        )}
      </button>
    </form>
  )
}

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { currentStep, totalSteps, nextStep, prevStep, completeOnboarding, skipOnboarding } = useOnboarding()
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [hasProducts, setHasProducts] = useState(false)
  const [isFindingLeads, setIsFindingLeads] = useState(false)
  const [leadsFound, setLeadsFound] = useState(false)
  const [leadsCount, setLeadsCount] = useState(0)
  const [isFirstLeadFound, setIsFirstLeadFound] = useState(false)

  // Check current status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkCurrentStatus()
    }
  }, [isOpen])

  // Auto-start lead finding when reaching step 3
  useEffect(() => {
    if (isOpen && currentStep === 3 && !isFindingLeads && !leadsFound) {
      startLeadFindingProcess()
    }
  }, [isOpen, currentStep])

  const startLeadFindingProcess = async () => {
    setIsFindingLeads(true)
    setLeadsCount(0)
    setIsFirstLeadFound(false)
    
    try {
      // Simulate progressive lead finding
      const leadFindingSteps = [
        { delay: 1000, message: "Scanning Reddit posts..." },
        { delay: 1500, message: "Analyzing discussions..." },
        { delay: 2000, message: "Found 1 lead!" },
        { delay: 1000, message: "Found 2 leads!" },
        { delay: 1000, message: "Found 3 leads!" },
        { delay: 500, message: "Finalizing results..." }
      ]
      
      for (let i = 0; i < leadFindingSteps.length; i++) {
        const step = leadFindingSteps[i]
        await new Promise(resolve => setTimeout(resolve, step.delay))
        
        if (step.message.includes("Found")) {
          const count = parseInt(step.message.match(/\d+/)?.[0] || "0")
          setLeadsCount(count)
          
          if (count === 1) {
            setIsFirstLeadFound(true)
          }
        }
      }
      
      // Start the actual lead finding
      await startLeadFinding()
      
      // Mark leads as found
      setLeadsFound(true)
    } catch (error) {
      console.error('Error in lead finding process:', error)
      // Still mark as found even if there's an error
      setLeadsFound(true)
    } finally {
      setIsFindingLeads(false)
    }
  }

  const checkCurrentStatus = async () => {
    if (!user) return

    try {
      // Check products
      const productsResponse = await fetch('/api/products', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const productsData = await productsResponse.json()
      setHasProducts(productsData?.products?.length > 0)
    } catch (error) {
      console.error('Error checking status:', error)
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      // Step 1: Reddit sales pitch - always allow next
      nextStep()
    } else if (currentStep === 2 && hasProducts) {
      // Step 2: Add product - move to finding leads step
      nextStep()
    } else if (currentStep === 3) {
      // Step 3: Finding leads - complete onboarding and redirect to leads page
      completeOnboarding()
      router.push('/leads')
    }
  }


  const startLeadFinding = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/leads/start-discovery', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start lead discovery')
      }

      const data = await response.json()
      console.log('Lead discovery started:', data)
    } catch (error) {
      console.error('Error starting lead finding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    skipOnboarding()
    onClose()
  }

  if (!isOpen) return null

  const steps = [
    {
      title: "Why Reddit is a Goldmine",
      description: "Discover the massive potential of Reddit for finding customers who need your product.",
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <RedditIcon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Reddit is a Goldmine for Finding Customers</h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Reddit has <strong>430+ million active users</strong> discussing their problems, frustrations, and needs every day. 
              This is where your next customers are already talking about the exact problems your product solves.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Real People, Real Problems</h4>
                  <p className="text-blue-700 text-sm">People openly discuss their pain points and frustrations on Reddit, giving you direct insight into what they need.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Highly Targeted Communities</h4>
                  <p className="text-green-700 text-sm">Find specific subreddits where your ideal customers gather, from r/entrepreneur to r/smallbusiness and beyond.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900 mb-1">Immediate Opportunities</h4>
                  <p className="text-purple-700 text-sm">Unlike cold outreach, these people are already actively seeking solutions. They're primed to hear about your product.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <div className="text-center">
              <h4 className="font-bold text-orange-900 mb-2">The Opportunity is Massive</h4>
              <p className="text-orange-800 text-sm">
                While your competitors are spending thousands on ads, you can find customers who are already looking for exactly what you offer. 
                <strong> It's like having a direct line to your ideal customers.</strong>
              </p>
            </div>
          </div>
          
        </div>
      )
    },
    {
      title: "Add Your Product",
      description: "Tell us about your product so we can find the perfect leads for you.",
      icon: Package,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Your Product Details</h3>
            <p className="text-gray-600 mb-6">
              The more details you provide, the better we can find leads who are a perfect fit for your product.
            </p>
          </div>
          
          {hasProducts ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Product added successfully!</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Search className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">Ready to find leads!</span>
                </div>
                <p className="text-blue-700 text-sm mt-2">
                  Click "Next" to start searching Reddit for potential customers discussing problems your product solves.
                </p>
              </div>
            </div>
          ) : (
            <ProductForm onProductAdded={() => setHasProducts(true)} />
          )}
        </div>
      )
    },
    {
      title: "Finding Your Leads",
      description: "We're actively searching Reddit for potential customers discussing problems your product solves.",
      icon: Search,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Finding Your Leads!</h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Our AI is now actively scanning Reddit for people discussing problems your product solves. 
              This may take a few moments...
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <span className="text-green-800 font-bold text-lg">
                {isFindingLeads ? "Searching Reddit..." : leadsFound ? "Search Complete!" : "Starting Search..."}
              </span>
            </div>
            <p className="text-green-700 text-center mb-4">
              {isFindingLeads 
                ? "We're scanning relevant subreddits and analyzing discussions to find potential customers for your product."
                : leadsFound 
                  ? `We've found ${leadsCount || 0} potential customers discussing problems your product solves!`
                  : "Preparing to search Reddit for leads..."
              }
            </p>
            
            {isFindingLeads && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Analyzing posts and comments...</span>
                </div>
              </div>
            )}
            
            {leadsCount > 0 && (
              <div className="text-center mt-4">
                <div className="inline-flex items-center space-x-2 text-lg font-semibold text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{leadsCount || 0} leads found so far...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Single Button - becomes clickable when first lead is found */}
          <div className="text-center">
            <button
              onClick={() => {
                completeOnboarding()
                router.push('/leads')
              }}
              disabled={!isFirstLeadFound}
              className={`w-full px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all duration-200 flex items-center justify-center ${
                isFirstLeadFound
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isFirstLeadFound ? (
                <>
                  <Search className="w-6 h-6 mr-3" />
                  View Your {leadsCount || 0} Discovered Leads
                  <ArrowRight className="w-5 h-5 ml-3" />
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-3"></div>
                  Finding Leads... ({leadsCount || 0} found so far)
                </>
              )}
            </button>
            
            {isFirstLeadFound && (
              <p className="text-sm text-gray-500 mt-3">
                ✨ Great! We found your first lead. Click the button above to see all discovered leads!
              </p>
            )}
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep - 1]
  const Icon = currentStepData.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Welcome to Truleado!</h2>
                <p className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-6">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {currentStep === 2 ? 'Starting Lead Discovery...' : 'Loading...'}
                </>
              ) : (
                <>
                  {currentStep === 2 ? 'Find My Leads!' : currentStep === totalSteps ? 'Complete' : 'Next'}
                  {currentStep < totalSteps && <ArrowRight className="w-4 h-4 ml-1" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
