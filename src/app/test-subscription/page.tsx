'use client'

import { useState } from 'react'

export default function TestSubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const createSubscription = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/debug/fresh-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to create subscription')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Test Recurring Subscription Creation
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This will create a fresh customer and recurring subscription to test the billing system.
            </p>
            
            <button
              onClick={createSubscription}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              {loading ? 'Creating Subscription...' : 'Create Recurring Subscription'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-800 font-medium">Error:</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-green-800 font-medium mb-2">Success!</h3>
              <div className="text-green-700">
                <p className="mb-2"><strong>Message:</strong> {result.message}</p>
                
                {result.results && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Results:</h4>
                    <div className="bg-white p-3 rounded border">
                      <div className="mb-2">
                        <strong>Customer:</strong> {result.results.customer?.email} ({result.results.customer?.id})
                      </div>
                      <div className="mb-2">
                        <strong>Price:</strong> {result.results.price?.id} - {result.results.price?.billingCycle?.interval}ly recurring
                      </div>
                      <div className="mb-2">
                        <strong>Subscription:</strong> {result.results.subscription?.id} - Status: {result.results.subscription?.status}
                      </div>
                      {result.results.subscription?.nextBilledAt && (
                        <div>
                          <strong>Next Billing:</strong> {new Date(result.results.subscription.nextBilledAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {result.nextSteps && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Next Steps:</h4>
                    <ul className="list-disc list-inside text-sm">
                      {result.nextSteps.map((step: string, index: number) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
