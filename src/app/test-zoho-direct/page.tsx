'use client'

import { useState } from 'react'
import { sendWelcomeEmailDirect } from '@/lib/direct-email-service'

// Direct Zoho contact creation function (same as in signup)
async function createZohoContact(email: string, fullName: string) {
  try {
    console.log('🧪 Testing Zoho contact creation...')
    
    // Split full name into first and last name
    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0] || 'User'
    const lastName = nameParts.slice(1).join(' ') || ''

    console.log('Name split:', { firstName, lastName, email })

    // Get access token
    console.log('1️⃣ Getting access token...')
    const tokenResponse = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: '1000.82DRWH7GU91XIPF7ZN9Q3W9KZ770GY',
        client_secret: '30c61a291d791a0d1caa6e2ce193d069be007d6ea9',
        refresh_token: '1000.1aa3bd63937b5fb65d8e970165babc99.4df927f0368af5b8807bea0ee715c8cb',
      }),
    })

    console.log('Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Failed to get Zoho access token:', errorText)
      return { success: false, error: errorText }
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Access token received:', tokenData.access_token ? 'Yes' : 'No')

    // Create contact in Zoho CRM
    console.log('2️⃣ Creating contact in Zoho CRM...')
    const contactData = {
      First_Name: firstName,
      Last_Name: lastName,
      Email: email,
      Lead_Source: 'Truleado Website',
      Lead_Status: 'Not Contacted',
      Company: 'Individual',
      Description: `New user signup from Truleado - ${fullName} (${email})`
    }

    console.log('Contact data:', contactData)

    const contactResponse = await fetch('https://www.zohoapis.in/crm/v2/Contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [contactData]
      }),
    })

    console.log('Contact response status:', contactResponse.status)

    if (contactResponse.ok) {
      const result = await contactResponse.json()
      console.log('✅ Zoho contact created successfully:', result)
      return { success: true, contactId: result.data[0]?.details?.id }
    } else {
      const errorText = await contactResponse.text()
      console.error('❌ Failed to create Zoho contact:', errorText)
      return { success: false, error: errorText }
    }
  } catch (error) {
    console.error('❌ Zoho contact creation failed:', error)
    return { success: false, error: error.message }
  }
}

export default function TestZohoDirect() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: 'Test User',
    email: 'test@example.com'
  })

  const handleTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Test both email and Zoho
      console.log('🧪 Testing both email and Zoho integration...')
      
      const [emailResult, zohoResult] = await Promise.allSettled([
        sendWelcomeEmailDirect(formData.email, formData.name),
        createZohoContact(formData.email, formData.name)
      ])

      const results = {
        email: emailResult.status === 'fulfilled' ? emailResult.value : { success: false, error: emailResult.reason },
        zoho: zohoResult.status === 'fulfilled' ? zohoResult.value : { success: false, error: zohoResult.reason }
      }

      setResult(results)
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Email & Zoho CRM Test
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Test Email & Zoho Contact Creation
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
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
                      Creating Contact...
                    </>
                  ) : (
                    'Test Email & Zoho Contact'
                  )}
                </button>
              </div>
            </div>

            {result && (
              <div className={`border rounded-lg p-4 ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                <pre className={`text-sm mt-2 overflow-x-auto ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-800 font-medium mb-2">Instructions:</h3>
              <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                <li>Enter a test name and email above</li>
                <li>Click "Test Email & Zoho Contact"</li>
                <li>Check the browser console for detailed logs</li>
                <li>Check your email inbox for the welcome email</li>
                <li>Check your Zoho CRM for the new contact</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
