'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, XCircle } from 'lucide-react'
import AppLayout from '@/components/app-layout'

export default function BillingCancelPage() {
  const router = useRouter()

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <XCircle className="w-20 h-20 text-orange-500 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges have been made to your account.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/upgrade')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              Try Again
              <ArrowLeft className="w-4 h-4 ml-2" />
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200"
            >
              Return to Dashboard
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>You can upgrade anytime from your dashboard or settings page.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}