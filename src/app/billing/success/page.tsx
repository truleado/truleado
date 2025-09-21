'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/app-layout'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function BillingSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id')
    if (sessionIdParam) {
      setSessionId(sessionIdParam)
    }
    setLoading(false)
  }, [searchParams])

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Processing your payment...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Thank you for upgrading to Pro. Your subscription is now active.
            </p>
          </div>

          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Session ID:</span> {sessionId}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard?payment_success=true')}
              className="w-full bg-[#148cfc] text-white px-6 py-3 rounded-lg hover:bg-[#0d7ce8] flex items-center justify-center"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            
            <button
              onClick={() => router.push('/products')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200"
            >
              Start Creating Products
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              You can manage your subscription in{' '}
              <button
                onClick={() => router.push('/settings?tab=billing')}
                className="text-[#148cfc] hover:underline"
              >
                Settings → Billing
              </button>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}