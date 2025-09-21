'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'
import { initializePaddle } from '@paddle/paddle-js'

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
  const [paddleInstance, setPaddleInstance] = useState<any>(null)
  const router = useRouter()

  // Initialize Paddle using the official npm package
  const initializePaddleInstance = useCallback(async () => {
    try {
      console.log('Initializing Paddle with npm package...')
      console.log('Client Token:', clientToken ? 'Present' : 'Missing')
      console.log('Environment:', environment)
      console.log('Price ID:', priceId ? 'Present' : 'Missing')

      if (!clientToken) {
        throw new Error('Paddle client token is required')
      }

      if (!priceId) {
        throw new Error('Paddle price ID is required')
      }

      // Initialize Paddle using the official npm package
      const paddle = await initializePaddle({
        token: clientToken,
        environment: environment,
        debug: environment === 'sandbox',
        eventCallback: (event: any) => {
          try {
            console.log('Paddle event:', event)
            if (!event || !event.name) return

            if (event.name === 'checkout.completed') {
              setIsLoading(false)
              const data = event.data || {}
              if (onSuccess) {
                onSuccess(data)
              } else {
                const txId = data.transactionId || data.id
                router.push(`/billing/success?session_id=${txId || ''}`)
              }
            }

            if (event.name === 'checkout.closed') {
              setIsLoading(false)
            }

            if (event.name === 'checkout.error') {
              setIsLoading(false)
              const err = (event.error || event.data || {})
              const message = err.message || 'Checkout failed'
              setError(message)
              if (onError) {
                onError(err)
              }
            }
          } catch (e) {
            console.error('Error handling Paddle event:', e)
          }
        }
      })

      console.log('Paddle initialized successfully with npm package')
      setPaddleInstance(paddle)
      setPaddleLoaded(true)
      setError(null)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Paddle'
      console.error('Paddle initialization error:', errorMessage)
      setError(errorMessage)
      setPaddleLoaded(false)
      
      if (onError) {
        onError({ message: errorMessage })
      }
    }
  }, [clientToken, environment, priceId, onError])

  // Initialize on mount
  useEffect(() => {
    initializePaddleInstance()
  }, [initializePaddleInstance])

  // Handle checkout
  const handleCheckout = useCallback(async () => {
    if (!paddleLoaded || !paddleInstance) {
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

      // Open checkout
      paddleInstance.Checkout.open(checkoutData)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open checkout'
      console.error('Checkout error:', errorMessage)
      setIsLoading(false)
      setError(errorMessage)
      
      if (onError) {
        onError({ message: errorMessage })
      }
    }
  }, [paddleLoaded, paddleInstance, priceId, customerEmail, customData, onSuccess, onError, router])

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