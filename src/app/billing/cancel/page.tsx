'use client'

import { AppLayout } from '@/components/app-layout'
import { XCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BillingCancel() {
  const router = useRouter()

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Cancelled
            </h1>
            <p className="text-gray-600">
              Your payment was cancelled. No charges have been made to your account.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/upgrade')}
              className="w-full bg-[#148cfc] text-white px-6 py-3 rounded-lg hover:bg-[#0d7ce8] flex items-center justify-center"
            >
              Try Again
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              Need help? Contact us at{' '}
              <a href="mailto:support@truleado.com" className="text-[#148cfc] hover:underline">
                support@truleado.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}