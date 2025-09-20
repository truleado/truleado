'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import AppLayout from '@/components/app-layout'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function BillingSuccessPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('')

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check subscription status after a short delay to allow webhook processing
    const checkSubscriptionStatus = async () => {
      try {
        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const response = await fetch('/api/billing/status')
        if (response.ok) {
          const data = await response.json()
          setSubscriptionStatus(data.subscription_status)
        }
      } catch (error) {
        console.error('Error checking subscription status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSubscriptionStatus()
  }, [user, router])

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your subscription...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-96 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for subscribing to Truleado Pro! Your account has been upgraded and you now have access to all premium features.
          </p>

          {subscriptionStatus === 'active' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">✅ Subscription Active</p>
              <p className="text-green-700 text-sm">You can now access all Pro features</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center justify-center"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            
            <button
              onClick={() => router.push('/products')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200"
            >
              Manage Products
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@truleado.com" className="text-blue-600 hover:text-blue-700">
                support@truleado.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

