'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setError(error.message)
        } else {
          setUser(session?.user || null)
        }
      } catch (err) {
        setError('Failed to check auth')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const handleSignIn = () => {
    window.location.href = '/auth/signin'
  }

  const handleTestCheckout = async () => {
    if (!user) {
      setError('Please sign in first')
      return
    }

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Checkout success:', data)
        window.open(data.checkout_url, '_blank')
      } else {
        setError(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      setError('Network error: ' + (error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Auth Test</h1>
        
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Current User:</h2>
          {user ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-green-800">
                <strong>ID:</strong> {user.id}
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Not signed in</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {!user ? (
            <button
              onClick={handleSignIn}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={handleTestCheckout}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Test Checkout
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}


