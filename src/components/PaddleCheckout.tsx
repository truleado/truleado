'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'
import {
  initializePaddle,
  type Paddle,
  type Environments,
  type PaddleEventData,
  type CheckoutOpenOptions,
  CheckoutEventNames,
} from '@paddle/paddle-js'

interface PaddleCheckoutProps {
  priceId?: string
  clientToken?: string
  environment?: Environments
  customerEmail?: string
  customData?: Record<string, unknown>
  onSuccess?: (event: PaddleEventData) => void
  onError?: (error: unknown) => void
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
  const [paddleInstance, setPaddleInstance] = useState<Paddle | undefined>(undefined)
  const router = useRouter()

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

      const paddle = await initializePaddle({
        token: clientToken,
        environment: environment,
        debug: environment === 'sandbox',
        eventCallback: (event: PaddleEventData) => {
          if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) {
            console.log('Checkout completed:', event)
            setIsLoading(false)
            onSuccess?.(event)
            const transactionId = event.data?.transaction_id
            if (transactionId) {
              router.push(`/billing/success?session_id=${transactionId}`)
            }
          } else if (event.name === CheckoutEventNames.CHECKOUT_CLOSED) {
            console.log('Checkout closed:', event)
            setIsLoading(false)
          } else if (event.name === CheckoutEventNames.CHECKOUT_ERROR || event.name === CheckoutEventNames.CHECKOUT_FAILED) {
            console.error('Checkout error:', event)
            setIsLoading(false)
            setError(event.error?.detail || 'Checkout failed')
            onError?.(event.error || event)
          }
        },
      })

      console.log('Paddle initialized successfully with npm package')
      setPaddleInstance(paddle)
      setPaddleLoaded(Boolean(paddle))
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Paddle'
      console.error('Paddle initialization error:', errorMessage)
      setError(errorMessage)
      setPaddleLoaded(false)
      onError?.({ message: errorMessage })
    }
  }, [clientToken, environment, priceId, onSuccess, onError, router])

  useEffect(() => {
    initializePaddleInstance()
  }, [initializePaddleInstance])

  const handleCheckout = useCallback(async () => {
    if (!paddleLoaded || !paddleInstance) {
      const errorMsg = 'Paddle is not loaded'
      console.error(errorMsg)
      setError(errorMsg)
      onError?.({ message: errorMsg })
      return
    }

    if (!priceId) {
      const errorMsg = 'Price ID is required'
      console.error(errorMsg)
      setError(errorMsg)
      onError?.({ message: errorMsg })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const checkoutData: CheckoutOpenOptions = {
        items: [
          {
            priceId: priceId,
            quantity: 1,
          },
        ],
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          allowLogout: false,
        },
      }

      if (customerEmail) {
        checkoutData.customer = {
          email: customerEmail,
        }
      }

      if (customData) {
        checkoutData.customData = customData
      }

      console.log('Opening Paddle checkout with data:', checkoutData)
      paddleInstance.Checkout.open(checkoutData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open checkout'
      console.error('Checkout error:', errorMessage)
      setIsLoading(false)
      setError(errorMessage)
      onError?.({ message: errorMessage })
    }
  }, [paddleLoaded, paddleInstance, priceId, customerEmail, customData, onError])

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