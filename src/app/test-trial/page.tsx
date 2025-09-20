'use client'

import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/lib/subscription-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TestTrial() {
  const { user, loading } = useAuth()
  const { accessLevel, trialTimeRemaining, showUpgradePrompt } = useSubscription()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return <div className="p-8">Not authenticated</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Trial System Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Created:</strong> {user.created_at}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
        <div className="space-y-2">
          <p><strong>Access Level:</strong> {accessLevel}</p>
          <p><strong>Trial Time Remaining:</strong> {trialTimeRemaining}</p>
          <p><strong>Show Upgrade Prompt:</strong> {showUpgradePrompt ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        <div className="space-y-4">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => window.location.href = '/settings'}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-4"
          >
            Go to Settings
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-yellow-700">
          <li>Check if trial banner appears on dashboard</li>
          <li>Check if trial countdown shows in settings</li>
          <li>Test upgrade button functionality</li>
          <li>Verify access control works</li>
        </ol>
      </div>
    </div>
  )
}
