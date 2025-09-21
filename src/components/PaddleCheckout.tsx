'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CreditCard } from 'lucide-react'

declare global {
  interface Window {
    Paddle: any
    paddleInitialized?: boolean
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
  const router = useRouter()

  useEffect(() => {
    const loadPaddle = async () => {
      console.log('PaddleCheckout: Loading Paddle with clientToken:', clientToken ? 'present' : 'missing')
      console.log('PaddleCheckout: Environment:', environment)
      
      if (!clientToken) {
        console.error('PaddleCheckout: No client token provided')
        if (onError) {
          onError({ message: 'Paddle client token is required' })
        }
        return
      }

      if (typeof window !== 'undefined' && !window.Paddle) {
        const script = document.createElement('script')
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
        script.async = true
        
        script.onload = () => {
          console.log('PaddleCheckout: Paddle.js loaded successfully')
          if (window.Paddle && clientToken) {
            try {
              window.Paddle.initialize({
                token: clientToken,
                environment: environment
              })
              window.paddleInitialized = true
              setPaddleLoaded(true)
              console.log('PaddleCheckout: Paddle initialized with environment:', environment)
            } catch (error) {
              console.error('PaddleCheckout: Failed to initialize Paddle:', error)
              if (onError) {
                onError({ message: 'Failed to initialize Paddle' })
              }
            }
          }
        }
        
        script.onerror = () => {
          console.error('PaddleCheckout: Failed to load Paddle.js')
          if (onError) {
            onError({ message: 'Failed to load Paddle.js' })
          }
        }
        
        document.head.appendChild(script)
      } else if (window.Paddle && clientToken) {
        // Paddle already loaded, check if already initialized
        try {
          // Check if Paddle is already initialized using our global flag
          if (window.paddleInitialized || window.Paddle.Checkout) {
            console.log('PaddleCheckout: Paddle already initialized, skipping re-initialization')
            setPaddleLoaded(true)
          } else {
            // Initialize if not already done
            window.Paddle.initialize({
              token: clientToken,
              environment: environment
            })
            window.paddleInitialized = true
            setPaddleLoaded(true)
            console.log('PaddleCheckout: Paddle initialized with environment:', environment)
          }
        } catch (error) {
          console.error('PaddleCheckout: Failed to initialize Paddle:', error)
          if (onError) {
            onError({ message: 'Failed to initialize Paddle' })
          }
        }
      }
    }

    loadPaddle()
  }, [clientToken, environment, onError])

  const handleCheckout = async () => {
    if (!paddleLoaded || !window.Paddle) {
      console.error('Paddle not loaded')
      if (onError) {
        onError({ message: 'Paddle not loaded' })
      }
      return
    }

    if (!priceId) {
      console.error('Price ID is required')
      if (onError) {
        onError({ message: 'Price ID is required' })
      }
      return
    }

    setIsLoading(true)

    try {
      const checkoutData: any = {
        items: [
          {
            priceId: priceId,
            quantity: 1
          }
        ]
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

      window.Paddle.Checkout.open({
        ...checkoutData,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en'
        }
      })

      // Handle checkout events
      window.Paddle.Checkout.onComplete((data: any) => {
        console.log('Checkout completed:', data)
        setIsLoading(false)
        
        if (onSuccess) {
          onSuccess(data)
        } else {
          // Default success behavior - redirect to success page
          router.push(`/billing/success?session_id=${data.transactionId}`)
        }
      })

      window.Paddle.Checkout.onClose((data: any) => {
        console.log('Checkout closed:', data)
        setIsLoading(false)
      })

      window.Paddle.Checkout.onError((error: any) => {
        console.error('Checkout error:', error)
        setIsLoading(false)
        
        if (onError) {
          onError(error)
        }
      })

    } catch (error) {
      console.error('Error opening checkout:', error)
      setIsLoading(false)
      
      if (onError) {
        onError(error)
      }
    }
  }

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
