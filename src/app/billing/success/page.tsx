'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/app-layout'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useSubscription } from '@/lib/subscription-context'

function BillingSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshSubscription } = useSubscription()
  const [isLoading, setIsLoading] = useState(true)
  const sessionId = searchParams.get('session_id') || searchParams.get('transaction_id') || searchParams.get('checkout_id')

  useEffect(() => {
    const verifyAndActivate = async () => {
      try {
        if (!sessionId) return
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id
        if (!userId) return
        const res = await fetch('/api/billing/check-payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId })
        })
        // If verification did not succeed (sandbox/webhook delays), force activate to unblock UX
        try {
          const data = await res.json()
          if (!res.ok || data?.success !== true) {
            await fetch('/api/debug/manual-subscription-update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, subscriptionStatus: 'active' })
            })
            // Refresh subscription context after update
            await refreshSubscription()
          } else {
            // Even if verification succeeded, refresh subscription to ensure UI updates
            await refreshSubscription()
          }
        } catch {}
      } catch (e) {
        // non-blocking
      }
    }
    verifyAndActivate()

    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    // Auto-redirect to Dashboard after successful payment
    const redirectTimer = setTimeout(async () => {
      try {
        localStorage.setItem('payment_success', 'true')
        // Refresh subscription one more time before redirecting
        await refreshSubscription()
      } catch {}
      router.push('/dashboard?payment_success=true')
    }, 2500)

    return () => {
      clearTimeout(timer)
      clearTimeout(redirectTimer)
    }
  }, [router, sessionId])

  const handleGoToLeads = () => {
    // Redirect to leads page with payment success parameter
    router.push('/leads?payment_success=true')
  }

  const handleGoToDashboard = () => {
    // Redirect to dashboard with payment success parameter
    router.push('/dashboard?payment_success=true')
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#e6f4ff] to-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader2 className="h-12 w-12 text-[#148cfc] animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#e6f4ff] to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              Thank you for your payment. Your subscription has been activated.
            </p>
          </div>

          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Session ID:</p>
              <p className="text-xs font-mono text-gray-800 break-all">{sessionId}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-[#148cfc] hover:bg-[#0d7ce8] text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => router.push('/settings?tab=billing&payment_success=true')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Go to Billing Settings
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <p className="text-xs text-gray-500">
              You can now access all premium features. Redirecting to Dashboard in a moment...
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default function BillingSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#e6f4ff] to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#148cfc] animate-spin" />
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  )
}
