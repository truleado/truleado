'use client'

import { useState } from 'react'
import { sendUpgradeThankYouEmail } from '@/lib/upgrade-email-service'

export default function TestUpgradeEmailPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [formData, setFormData] = useState({
    name: 'Test User',
    email: 'test@example.com',
    planType: 'Pro'
  })

  const handleTestUpgradeEmail = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🧪 Testing upgrade thank you email...')
      
      const emailResult = await sendUpgradeThankYouEmail(formData.email, formData.name, formData.planType)
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
            Upgrade Thank You Email Test
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Test Upgrade Thank You Email
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.planType}
                    onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                  >
                    <option value="Pro">Pro</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <button
                  onClick={handleTestUpgradeEmail}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending Email...
                    </>
                  ) : (
                    'Send Upgrade Thank You Email'
                  )}
                </button>
              </div>
            </div>

            {result && (
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? '✅ Upgrade Email Sent Successfully!' : '❌ Upgrade Email Failed'}
                </h3>
                <pre className={`p-3 rounded-md text-sm overflow-x-auto ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-800 font-medium mb-2">Instructions:</h3>
              <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                <li>Enter the user's name and email address</li>
                <li>Select the plan type they upgraded to</li>
                <li>Click "Send Upgrade Thank You Email"</li>
                <li>Check the email inbox for the thank you email</li>
                <li>Check browser console for detailed logs</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-800 font-medium mb-2">When This Email is Sent:</h3>
              <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                <li>When a user successfully upgrades to Pro plan</li>
                <li>Automatically triggered by Paddle webhook</li>
                <li>Sent to the user's email address</li>
                <li>Includes plan benefits and next steps</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
