'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TestNewCheckout() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [testData, setTestData] = useState<any>(null)
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [loadingCheckout, setLoadingCheckout] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  const loadTestData = async () => {
    try {
      const response = await fetch('/api/test-new-checkout')
      if (response.ok) {
        const data = await response.json()
        setTestData(data)
      }
    } catch (error) {
      console.error('Error loading test data:', error)
    }
  }

  const testCheckout = async () => {
    setLoadingCheckout(true)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCheckoutUrl(data.checkout_url)
      } else {
        console.error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoadingCheckout(false)
    }
  }

  useEffect(() => {
    loadTestData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return <div className="p-8">Not authenticated</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">New Paddle Checkout Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>
      </div>

      {testData && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">New Checkout Format</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Product ID: {testData.productId}</h3>
              <p className="text-sm text-gray-500">Price ID: {testData.priceId}</p>
              <p className="text-sm text-gray-500">Environment: {testData.environment}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Test URL (Price-based)</h3>
              <div className="border rounded p-3">
                <p className="text-xs text-gray-500 break-all mb-2">{testData.testUrl}</p>
                <button 
                  onClick={() => window.open(testData.testUrl, '_blank')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Test New URL Format
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Updated Checkout</h2>
        <button 
          onClick={testCheckout}
          disabled={loadingCheckout}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loadingCheckout ? 'Generating...' : 'Generate Updated Checkout URL'}
        </button>
      </div>

      {checkoutUrl && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Generated Checkout URL</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 break-all">{checkoutUrl}</p>
            <div className="space-x-4">
              <button 
                onClick={() => window.open(checkoutUrl, '_blank')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Test Updated URL
              </button>
              <button 
                onClick={() => window.location.href = checkoutUrl}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Redirect to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">What's New</h3>
        <ul className="list-disc list-inside space-y-2 text-green-700">
          <li>Switched from product-based to price-based checkout URLs</li>
          <li>Using the correct Paddle checkout format</li>
          <li>Should work better with your Paddle configuration</li>
          <li>Test both URLs above to verify they work</li>
        </ul>
      </div>
    </div>
  )
}
