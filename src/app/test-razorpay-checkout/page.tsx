'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import AppLayout from '@/components/app-layout'

export default function TestRazorpayCheckoutPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTestCheckout = async () => {
    if (!user) {
      setError('Please sign in first')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        // Open the checkout URL in a new tab
        window.open(data.checkout_url, '_blank')
      } else {
        setError(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      setError('Network error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Razorpay Checkout</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Checkout Flow Test</h2>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This page tests the Razorpay checkout integration. Click the button below to create a checkout session.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Current User:</h3>
              <p className="text-sm text-gray-600">
                {user ? `${user.email} (${user.id})` : 'Not signed in'}
              </p>
            </div>
          </div>

          <button
            onClick={handleTestCheckout}
            disabled={loading || !user}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Checkout...' : 'Test Checkout Flow'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
              <div className="text-green-700">
                <p><strong>Subscription ID:</strong> {result.subscription_id}</p>
                <p><strong>Customer ID:</strong> {result.customer_id}</p>
                <p><strong>Checkout URL:</strong> <a href={result.checkout_url} target="_blank" rel="noopener noreferrer" className="underline">Open Checkout</a></p>
              </div>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500">
            <h3 className="font-semibold mb-2">What happens next:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Test Checkout Flow" to create a Razorpay subscription</li>
              <li>A new tab will open with the Razorpay checkout page</li>
              <li>Complete the payment process</li>
              <li>Webhook will update your subscription status</li>
              <li>You'll be redirected to the success page</li>
            </ol>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
