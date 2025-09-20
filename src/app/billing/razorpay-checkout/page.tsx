'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function RazorpayCheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const subscriptionId = searchParams.get('subscription_id')

  useEffect(() => {
    if (!subscriptionId) {
      setError('No subscription ID provided')
      setLoading(false)
      return
    }

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      initializeRazorpay()
    }
    script.onerror = () => {
      setError('Failed to load Razorpay')
      setLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [subscriptionId])

  const initializeRazorpay = () => {
    if (!window.Razorpay) {
      setError('Razorpay not loaded')
      setLoading(false)
      return
    }

    const options = {
      subscription_id: subscriptionId,
      name: 'Truleado',
      description: 'Truleado Pro Subscription - Unlimited Lead Discovery',
      image: '/logo.png',
      theme: {
        color: '#3B82F6'
      },
      prefill: {
        name: 'Truleado User',
        email: 'user@truleado.com'
      },
      notes: {
        source: 'truleado_app'
      },
      handler: function (response: any) {
        console.log('Payment successful:', response)
        // Redirect to success page with payment details
        router.push(`/billing/success?payment_id=${response.razorpay_payment_id}&subscription_id=${response.razorpay_subscription_id}`)
      },
      modal: {
        ondismiss: function() {
          router.push('/billing/cancel')
        }
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Opening checkout...</p>
      </div>
    </div>
  )
}
