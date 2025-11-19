'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

declare global {
  interface Window {
    Paddle: any
  }
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const paddleInitialized = useRef(false)

  const loadPaddleScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Paddle) {
        resolve()
        return
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="paddle.com/paddle"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Paddle script')))
        return
      }

      // Load the script
      const script = document.createElement('script')
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
      script.async = true
      script.onload = () => {
        console.log('Paddle.js loaded successfully')
        resolve()
      }
      script.onerror = () => {
        console.error('Failed to load Paddle.js script')
        reject(new Error('Failed to load Paddle checkout script'))
      }
      document.head.appendChild(script)
    })
  }, [])

  const pollForSubscriptionStatus = useCallback(() => {
    let pollCount = 0
    const maxPolls = 30 // Poll for up to 60 seconds (30 * 2 seconds)
    
    const pollInterval = setInterval(async () => {
      pollCount++
      try {
        const response = await fetch('/api/billing/status')
        if (response.ok) {
          const data = await response.json()
          console.log(`[Poll ${pollCount}] Subscription status:`, data.subscription_status)
          
          // If user has active subscription or trial, redirect to dashboard
          if (data.subscription_status === 'active' || data.subscription_status === 'trial') {
            clearInterval(pollInterval)
            console.log('✅ Subscription active, redirecting to dashboard')
            router.push('/dashboard?payment_success=true')
            return
          }
          
          // If still pending after several polls, keep polling
          if (data.subscription_status === 'pending' && pollCount >= maxPolls) {
            clearInterval(pollInterval)
            console.log('⚠️ Still pending after max polls, user may need to complete checkout')
          }
        }
      } catch (err) {
        console.error('Error polling subscription status:', err)
      }
      
      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval)
      }
    }, 2000) // Poll every 2 seconds
  }, [router])

  const openFullScreenCheckout = useCallback((clientToken: string, priceId: string, environment: string) => {
    try {
      if (!window.Paddle) {
        throw new Error('Paddle SDK is not loaded. Please refresh the page.')
      }

      if (!window.Paddle.Checkout) {
        throw new Error('Paddle Checkout is not available. Please check your Paddle configuration.')
      }

      console.log('Opening Paddle checkout with:', { priceId, environment, hasUser: !!user })

      // Use overlay mode to avoid CSP iframe issues
      // Overlay mode provides a full-screen modal experience
      const checkoutOptions = {
        items: [{ priceId, quantity: 1 }],
        customer: {
          email: user?.email || '',
          name: user?.user_metadata?.full_name || user?.email || ''
        },
        settings: {
          successUrl: `${window.location.origin}/dashboard?payment_success=true`,
          displayMode: 'overlay' as const,
          theme: 'light' as const,
          locale: 'en' as const
        },
        customData: {
          user_id: user?.id || '',
          user_email: user?.email || ''
        }
      }

      console.log('Opening overlay checkout...')
      
      // Open checkout - Paddle.js v2 handles events differently
      // We'll rely on successUrl redirect and polling for status updates
      const checkoutInstance = window.Paddle.Checkout.open(checkoutOptions)
      
      setCheckoutOpen(true)
      setIsInitializing(false)

      // Start polling for subscription status immediately
      // The webhook will update the status when checkout completes
      pollForSubscriptionStatus()

      // Note: Paddle.js v2 doesn't use .on() for events
      // Events are handled via:
      // 1. successUrl redirect (when checkout completes successfully)
      // 2. Webhooks (which update the database)
      // 3. Polling (which checks for status updates)

    } catch (err) {
      console.error('Error opening checkout:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to open checkout'
      setError(`${errorMessage}. Please check your browser console for details and try refreshing the page.`)
      setIsInitializing(false)
    }
  }, [user, pollForSubscriptionStatus])

  const initializeCheckout = useCallback(async () => {
    try {
      setIsInitializing(true)
      setError(null)

      // Get client token and price ID
      const response = await fetch('/api/billing/client-token')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get checkout configuration')
      }

      const { clientToken, priceId, environment } = await response.json()

      if (!clientToken || !priceId) {
        throw new Error('Checkout configuration missing. Please check your Paddle settings.')
      }

      console.log('Paddle config received:', { hasToken: !!clientToken, hasPriceId: !!priceId, environment })

      // Load Paddle.js script
      await loadPaddleScript()

      // Wait for Paddle to be fully ready
      let attempts = 0
      const maxAttempts = 20
      while (!window.Paddle && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (!window.Paddle) {
        throw new Error('Paddle SDK failed to load. Please refresh the page.')
      }

      // Wait a bit more for Paddle to be fully initialized
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if Paddle is already initialized
      if (!paddleInitialized.current) {
        console.log('Initializing Paddle with token:', clientToken.substring(0, 10) + '...')
        
        // Set environment first (required before Initialize)
        if (window.Paddle.Environment && typeof window.Paddle.Environment.set === 'function') {
          const env = environment === 'production' ? 'production' : 'sandbox'
          console.log('Setting Paddle environment to:', env)
          window.Paddle.Environment.set(env)
        }
        
        // Use Paddle.Initialize() for v2 API - only pass token, not environment
        if (typeof window.Paddle.Initialize === 'function') {
          console.log('Using Paddle.Initialize()')
          window.Paddle.Initialize({
            token: clientToken
          })
        } else if (typeof window.Paddle.Set === 'function') {
          // Fallback for older API
          console.log('Using Paddle.Set() (fallback)')
          window.Paddle.Set({ 
            token: clientToken
          })
        } else {
          console.error('Available Paddle methods:', Object.keys(window.Paddle))
          throw new Error('Paddle initialization method not found. Available methods: ' + Object.keys(window.Paddle).join(', '))
        }
        paddleInitialized.current = true
        console.log('Paddle initialized successfully')
      }

      // Open full-screen checkout
      openFullScreenCheckout(clientToken, priceId, environment)

    } catch (err) {
      console.error('Error initializing checkout:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize checkout')
      setIsInitializing(false)
    }
  }, [loadPaddleScript, openFullScreenCheckout])

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/auth/signin')
      return
    }

    // Check if user already has a subscription
    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/billing/status')
        if (response.ok) {
          const data = await response.json()
          setSubscriptionStatus(data.subscription_status)
          
          // Allow checkout for cancelled subscriptions (restart flow)
          // Only redirect if user has active or trial (not cancelled)
          if (data.subscription_status === 'active' || (data.subscription_status === 'trial' && data.subscription_status !== 'cancelled')) {
            // User already has active subscription, redirect to dashboard
            router.push('/dashboard')
            return
          }
          // If cancelled or pending, proceed to checkout
        }
      } catch (err) {
        console.error('Error checking subscription:', err)
      }

      // Initialize Paddle and show checkout
      initializeCheckout()
    }

    if (user && !authLoading) {
      checkSubscription()
    }
  }, [user, authLoading, router, initializeCheckout])

  // Full-screen blocking checkout - no app layout
  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-hidden">
      {isInitializing && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting up checkout...</h2>
            <p className="text-gray-600">Please wait while we prepare your payment form</p>
          </div>
        </div>
      )}

      {error && (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setError(null)
                  setIsInitializing(true)
                  paddleInitialized.current = false
                  initializeCheckout()
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )}

      {!isInitializing && !error && (
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900">
                {subscriptionStatus === 'cancelled' ? 'Restart Your Subscription' : 'Complete Your Signup'}
              </h1>
              <p className="text-gray-600 mt-1">
                {subscriptionStatus === 'cancelled' 
                  ? 'Enter your payment details to restart your subscription with a 7-day free trial. After the trial, you\'ll be automatically charged $49/month.'
                  : 'Start your 7-day free trial. After the trial, you\'ll be automatically charged $49/month to continue using the app.'}
              </p>
            </div>
          </div>

          {/* Checkout Info - Overlay mode doesn't need a container */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-2xl text-center">
              {!checkoutOpen && (
                <div className="bg-white rounded-lg shadow-lg p-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Opening Checkout...</h3>
                  <p className="text-gray-600 mb-6">
                    The checkout form will open in a moment. Please wait while we prepare your payment form.
                  </p>
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              )}
              {checkoutOpen && (
                <div className="bg-white rounded-lg shadow-lg p-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Checkout is Open</h3>
                  <p className="text-gray-600">
                    Please complete the payment form that opened above. Once you're done, you'll be redirected to your dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
