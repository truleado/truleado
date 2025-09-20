'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import AppLayout from '@/components/app-layout'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function BillingCancelPage() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) {
    router.push('/auth/signin')
    return null
  }

  return (
    <AppLayout>
      <div className="min-h-96 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges have been made to your account. You can continue using your free trial or try again later.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-medium">⚠️ Trial Still Active</p>
            <p className="text-yellow-700 text-sm">You can continue using Truleado with your current trial</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/upgrade'}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions about pricing? Contact us at{' '}
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
