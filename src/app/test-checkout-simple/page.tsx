'use client'

import { useEffect, useState } from 'react'

export default function TestCheckoutSimple() {
  const [testData, setTestData] = useState<any>(null)
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [loadingCheckout, setLoadingCheckout] = useState(false)

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
        const errorData = await response.json()
        console.error('Failed to create checkout session:', errorData)
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Simple Paddle Checkout Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Information</h2>
        <p className="text-gray-600">This page tests the Paddle checkout without requiring authentication.</p>
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
        <h2 className="text-xl font-semibold mb-4">Test Checkout API</h2>
        <button 
          onClick={testCheckout}
          disabled={loadingCheckout}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loadingCheckout ? 'Generating...' : 'Test Checkout API (Will show Unauthorized)'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          This will show "Unauthorized" since you're not logged in, but it tests the API endpoint.
        </p>
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
                Test URL
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">What to Test</h3>
        <ol className="list-decimal list-inside space-y-2 text-green-700">
          <li>Click "Test New URL Format" to verify the Paddle checkout loads</li>
          <li>Click "Test Checkout API" to verify the API endpoint works</li>
          <li>If the URL works, the Paddle integration is fixed</li>
          <li>Then you can test the full flow by logging in</li>
        </ol>
      </div>
    </div>
  )
}
