'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TestPaddleProduct() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [testData, setTestData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  const loadTestData = async () => {
    setLoadingData(true)
    try {
      const response = await fetch('/api/test-paddle-product')
      if (response.ok) {
        const data = await response.json()
        setTestData(data)
      }
    } catch (error) {
      console.error('Error loading test data:', error)
    } finally {
      setLoadingData(false)
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
      <h1 className="text-3xl font-bold mb-8">Paddle Product Configuration Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>
      </div>

      {loadingData ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p>Loading test data...</p>
        </div>
      ) : testData ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Paddle Configuration</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Product ID: {testData.productId}</h3>
              <p className="text-sm text-gray-500">Price ID: {testData.priceId}</p>
              <p className="text-sm text-gray-500">Environment: {testData.environment}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Test URLs</h3>
              <div className="space-y-3">
                {testData.testUrls.map((url: string, index: number) => (
                  <div key={index} className="border rounded p-3">
                    <p className="text-xs text-gray-500 break-all mb-2">{url}</p>
                    <button 
                      onClick={() => window.open(url, '_blank')}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Test URL {index + 1}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Troubleshooting Steps</h3>
        <ol className="list-decimal list-inside space-y-2 text-red-700">
          {testData?.troubleshooting.map((step: string, index: number) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Next Steps</h3>
        <ol className="list-decimal list-inside space-y-2 text-yellow-700">
          <li>Test each URL above to see which one works</li>
          <li>If none work, check your Paddle dashboard</li>
          <li>Verify the product is published and active</li>
          <li>Check if the product has a valid price attached</li>
          <li>Make sure you're using the correct environment (sandbox vs production)</li>
        </ol>
      </div>
    </div>
  )
}
