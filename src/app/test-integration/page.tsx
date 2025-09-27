'use client'

import { useState } from 'react'

export default function TestIntegrationPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [formData, setFormData] = useState({
    name: 'Test User',
    email: 'test@example.com'
  })

  const handleTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🧪 Testing both integrations...')
      
      // Test email
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer re_FMUirfL...`, // Replace with your actual Resend API key
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Truleado <onboarding@resend.dev>',
          to: [formData.email],
          subject: 'Test Email from Truleado',
          html: `<h1>Test Email for ${formData.name}</h1><p>This is a test email from Truleado.</p>`
        }),
      })

      const emailResult = emailResponse.ok ? 
        { success: true, message: 'Email sent successfully' } : 
        { success: false, error: await emailResponse.text() }

      // Test Zoho
      const zohoResponse = await fetch('https://cors-anywhere.herokuapp.com/https://accounts.zoho.in/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: '1000.82DRWH7GU91XIPF7ZN9Q3W9KZ770GY',
          client_secret: '30c61a291d791a0d1caa6e2ce193d069be007d6ea9',
          refresh_token: '1000.1aa3bd63937b5fb65d8e970165babc99.4df927f0368af5b8807bea0ee715c8cb',
        }),
      })

      const zohoResult = zohoResponse.ok ? 
        { success: true, message: 'Zoho token received' } : 
        { success: false, error: await zohoResponse.text() }

      setResult({
        email: emailResult,
        zoho: zohoResult
      })
    } catch (error) {
      setResult({ 
        email: { success: false, error: error.message },
        zoho: { success: false, error: error.message }
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
            Integration Test
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Test Email & Zoho Integration
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
                    Email
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
                  onClick={handleTest}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testing...
                    </>
                  ) : (
                    'Test Both Integrations'
                  )}
                </button>
              </div>
            </div>

            {result && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Results:</h3>
                <pre className="bg-gray-200 p-3 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-800 font-medium mb-2">Important:</h3>
              <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
                <li>Replace the Resend API key in the code with your actual key</li>
                <li>Enable CORS proxy at <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" className="underline">cors-anywhere.herokuapp.com</a></li>
                <li>Check browser console for detailed logs</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
