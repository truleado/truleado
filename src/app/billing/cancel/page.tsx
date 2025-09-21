'use client'

import { useRouter } from 'next/navigation'
import AppLayout from '@/components/app-layout'
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'

export default function BillingCancel() {
  const router = useRouter()

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  const handleTryAgain = () => {
    router.push('/upgrade')
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#e6f4ff] to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
            <p className="text-gray-600">
              Your payment was cancelled. No charges have been made to your account.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleTryAgain}
              className="w-full bg-[#148cfc] hover:bg-[#0d7ce8] text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Try Again
            </button>
            
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            
            <p className="text-xs text-gray-500">
              If you're experiencing issues with payment, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
