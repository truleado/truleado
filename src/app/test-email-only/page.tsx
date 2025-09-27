'use client'

import { useState } from 'react'
import { sendWelcomeEmailDirect } from '@/lib/direct-email-service'

export default function TestEmailOnlyPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [formData, setFormData] = useState({
    name: 'Test User',
    email: 'test@example.com'
  })

  const handleTestEmail = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🧪 Testing Resend email integration...')
      
      const emailResult = await sendWelcomeEmailDirect(formData.email, formData.name)
      setResult(emailResult)
    } catch (error) {
      setResult({ 
        success: false, 
        error: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Resend Email Test
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Test Resend Email Integration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <button
                  onClick={handleTestEmail}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending Email...
                    </>
                  ) : (
                    'Send Test Email'
                  )}
                </button>
              </div>
            </div>

            {result && (
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? '✅ Email Sent Successfully!' : '❌ Email Failed'}
                </h3>
                <pre className={`p-3 rounded-md text-sm overflow-x-auto ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-800 font-medium mb-2">Instructions:</h3>
              <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                <li>Enter your email address above</li>
                <li>Click "Send Test Email"</li>
                <li>Check your email inbox for the welcome email</li>
                <li>Check browser console for detailed logs</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-800 font-medium mb-2">Troubleshooting:</h3>
              <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                <li>Make sure you're using a real email address</li>
                <li>Check spam folder if email doesn't arrive</li>
                <li>Verify Resend API key is correct</li>
                <li>Check browser console for error details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
