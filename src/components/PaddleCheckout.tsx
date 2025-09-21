'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'

declare global {
  interface Window {
    Paddle: any
    paddleInitialized?: boolean
    paddleClientToken?: string
  }
}

interface PaddleCheckoutProps {
  priceId?: string
  clientToken?: string
  environment?: 'sandbox' | 'production'
  customerEmail?: string
  customData?: Record<string, any>
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  className?: string
  children?: React.ReactNode
}

export default function PaddleCheckout({
  priceId,
  clientToken,
  environment = 'sandbox',
  customerEmail,
  customData,
  onSuccess,
  onError,
  className = '',
  children
}: PaddleCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paddleLoaded, setPaddleLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Load Paddle.js script
  const loadPaddleScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not available'))
        return
      }

      if (window.Paddle) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
      script.async = true
      
      script.onload = () => {
        console.log('Paddle.js loaded successfully')
        resolve()
      }
      
      script.onerror = () => {
        console.error('Failed to load Paddle.js')
        reject(new Error('Failed to load Paddle.js'))
      }
      
      document.head.appendChild(script)
    })
  }, [])

  // Initialize Paddle
  const initializePaddle = useCallback(async () => {
    try {
      console.log('Initializing Paddle...')
      console.log('Client Token:', clientToken ? 'Present' : 'Missing')
      console.log('Environment:', environment)
      console.log('Price ID:', priceId ? 'Present' : 'Missing')

      if (!clientToken) {
        throw new Error('Paddle client token is required')
      }

      if (!priceId) {
        throw new Error('Paddle price ID is required')
      }

      // Load Paddle script if not already loaded
      await loadPaddleScript()

      if (!window.Paddle) {
        throw new Error('Paddle.js failed to load')
      }

      // Check if already initialized with the same token
      if (window.paddleInitialized && window.paddleClientToken === clientToken) {
        console.log('Paddle already initialized with same token')
        setPaddleLoaded(true)
        return
      }

      // Initialize Paddle
      window.Paddle.initialize({
        token: clientToken,
        environment: environment,
        debug: environment === 'sandbox'
      })

      window.paddleInitialized = true
      window.paddleClientToken = clientToken
      setPaddleLoaded(true)
      setError(null)
      
      console.log('Paddle initialized successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Paddle'
      console.error('Paddle initialization error:', errorMessage)
      setError(errorMessage)
      setPaddleLoaded(false)
      
      if (onError) {
        onError({ message: errorMessage })
      }
    }
  }, [clientToken, environment, priceId, loadPaddleScript, onError])

  // Initialize on mount
  useEffect(() => {
    initializePaddle()
  }, [initializePaddle])

  // Handle checkout
  const handleCheckout = useCallback(async () => {
    if (!paddleLoaded || !window.Paddle) {
      const errorMsg = 'Paddle is not loaded'
      console.error(errorMsg)
      setError(errorMsg)
      if (onError) {
        onError({ message: errorMsg })
      }
      return
    }

    if (!priceId) {
      const errorMsg = 'Price ID is required'
      console.error(errorMsg)
      setError(errorMsg)
      if (onError) {
        onError({ message: errorMsg })
      }
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const checkoutData: any = {
        items: [
          {
            priceId: priceId,
            quantity: 1
          }
        ],
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          allowLogout: false
        }
      }

      if (customerEmail) {
        checkoutData.customer = {
          email: customerEmail
        }
      }

      if (customData) {
        checkoutData.customData = customData
      }

      console.log('Opening Paddle checkout with data:', checkoutData)

      // Set up event listeners before opening checkout
      window.Paddle.Checkout.onComplete((data: any) => {
        console.log('Checkout completed:', data)
        setIsLoading(false)
        
        if (onSuccess) {
          onSuccess(data)
        } else {
          // Default success behavior
          router.push(`/billing/success?session_id=${data.transactionId || data.id}`)
        }
      })

      window.Paddle.Checkout.onClose((data: any) => {
        console.log('Checkout closed:', data)
        setIsLoading(false)
      })

      window.Paddle.Checkout.onError((error: any) => {
        console.error('Checkout error:', error)
        setIsLoading(false)
        setError(error.message || 'Checkout failed')
        
        if (onError) {
          onError(error)
        }
      })

      // Open checkout
      window.Paddle.Checkout.open(checkoutData)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open checkout'
      console.error('Checkout error:', errorMessage)
      setIsLoading(false)
      setError(errorMessage)
      
      if (onError) {
        onError({ message: errorMessage })
      }
    }
  }, [paddleLoaded, priceId, customerEmail, customData, onSuccess, onError, router])

  // Show error state
  if (error) {
    return (
      <button 
        disabled 
        className={`inline-flex items-center gap-2 ${className}`}
      >
        <AlertCircle className="h-4 w-4" />
        {error}
      </button>
    )
  }

  // Show loading state
  if (!paddleLoaded) {
    return (
      <button 
        disabled 
        className={`inline-flex items-center gap-2 ${className}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {!clientToken ? 'Missing Paddle Config' : 'Loading Paddle...'}
      </button>
    )
  }

  // Show checkout button
  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || !priceId}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {children || (
            <>
              <CreditCard className="h-4 w-4" />
              Upgrade to Pro
            </>
          )}
        </>
      )}
    </button>
  )
}