'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TestCheckout() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [loadingCheckout, setLoadingCheckout] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

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

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return <div className="p-8">Not authenticated</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Paddle Checkout Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Checkout</h2>
        <button 
          onClick={testCheckout}
          disabled={loadingCheckout}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loadingCheckout ? 'Generating...' : 'Generate Checkout URL'}
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
                Open in New Tab
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
          <li>Click "Generate Checkout URL" to create a test checkout</li>
          <li>Click "Open in New Tab" to test the URL</li>
          <li>Check if Paddle checkout loads correctly</li>
          <li>If it works, the trial system is ready</li>
        </ol>
      </div>
    </div>
  )
}
