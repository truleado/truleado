'use client'

import { useState } from 'react'

export default function TestZohoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const testZohoContact = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/zoho/create-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Zoho CRM Integration Test
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Test Zoho Contact Creation
              </h2>
              <p className="text-gray-600 mb-4">
                Create a contact in Zoho CRM using your current user data.
              </p>
              
              <button
                onClick={testZohoContact}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Contact...
                  </>
                ) : (
                  'Create Zoho Contact'
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium">Error:</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-medium mb-2">Result:</h3>
                <pre className="text-green-700 text-sm overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-800 font-medium mb-2">Setup Instructions:</h3>
              <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                <li>Get Zoho CRM API credentials from <a href="https://api-console.zoho.com" target="_blank" rel="noopener noreferrer" className="underline">Zoho API Console</a></li>
                <li>Add these environment variables to Vercel:</li>
                <ul className="ml-4 mt-2 space-y-1 list-disc list-inside">
                  <li><code className="bg-blue-100 px-1 rounded">ZOHO_CLIENT_ID</code></li>
                  <li><code className="bg-blue-100 px-1 rounded">ZOHO_CLIENT_SECRET</code></li>
                  <li><code className="bg-blue-100 px-1 rounded">ZOHO_REFRESH_TOKEN</code></li>
                  <li><code className="bg-blue-100 px-1 rounded">ZOHO_REDIRECT_URI</code></li>
                  <li><code className="bg-blue-100 px-1 rounded">ZOHO_API_DOMAIN</code></li>
                </ul>
                <li>Run the database migration: <code className="bg-blue-100 px-1 rounded">migration-add-zoho-fields.sql</code></li>
                <li>Test the integration using the button above</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-800 font-medium mb-2">Features Included:</h3>
              <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                <li>✅ Automatic contact creation on user signup</li>
                <li>✅ Duplicate contact prevention</li>
                <li>✅ Contact updates when user data changes</li>
                <li>✅ Custom fields for user tracking</li>
                <li>✅ Lead source and status management</li>
                <li>✅ Error handling and logging</li>
                <li>✅ Database integration for contact IDs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
