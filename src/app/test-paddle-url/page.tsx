'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TestPaddleUrl() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [testUrls, setTestUrls] = useState<any>(null)
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [loadingCheckout, setLoadingCheckout] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  const loadTestUrls = async () => {
    try {
      const response = await fetch('/api/verify-paddle')
      if (response.ok) {
        const data = await response.json()
        setTestUrls(data)
      }
    } catch (error) {
      console.error('Error loading test URLs:', error)
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
    loadTestUrls()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return <div className="p-8">Not authenticated</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Paddle URL Testing</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>
      </div>

      {testUrls && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Different Paddle URLs</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Product ID: {testUrls.productId}</h3>
              <p className="text-sm text-gray-500">Environment: {testUrls.environment}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(testUrls.urls).map(([key, url]) => (
                <div key={key} className="border rounded p-4">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">{key.replace(/_/g, ' ')}</h4>
                  <p className="text-xs text-gray-500 break-all mb-3">{url as string}</p>
                  <button 
                    onClick={() => window.open(url as string, '_blank')}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Test URL
                  </button>
                </div>
              ))}
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
          <h2 className="text-xl font-semibold mb-4">Updated Checkout URL</h2>
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

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-yellow-700">
          <li>Test each URL above to see which one works</li>
          <li>Look for the "environment_specific" URL (sandbox-checkout.paddle.com)</li>
          <li>If that works, the updated checkout should work too</li>
          <li>Report which URL format works so we can finalize the solution</li>
        </ol>
      </div>
    </div>
  )
}
