'use client'

import { useState } from 'react'

export default function TestRecurringPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/test-recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to run test', details: error })
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/test-recurring')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to check status', details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Recurring Billing Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <button
            onClick={checkStatus}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Current Status'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Comprehensive Test</h2>
          <p className="text-gray-600 mb-4">
            This will create a test customer and subscription in Paddle to verify recurring billing works.
          </p>
          <button
            onClick={runTest}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Running Test...' : 'Run Recurring Billing Test'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
