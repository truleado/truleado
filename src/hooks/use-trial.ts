'use client'

import { useState } from 'react'
import { useSubscription } from '@/lib/subscription-context'
import { useAuth } from '@/lib/auth-context'

export function useTrial() {
  const { showUpgradePrompt, trialTimeRemaining } = useSubscription()
  const { user } = useAuth()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    try {
      // Try client-side Paddle checkout first
      const pubRes = await fetch('/api/billing/public-config')
      const pub = await pubRes.json()
      if (pub?.clientToken && pub?.priceId) {
        const { initializePaddle } = await import('@paddle/paddle-js')
        const paddle = await initializePaddle({
          environment: pub.environment === 'production' ? 'production' : 'sandbox',
          token: pub.clientToken,
          eventCallback: async (event: any) => {
            try {
              if (event?.name === 'checkout.completed') {
                // Mark success for refreshing subscription
                try { localStorage.setItem('payment_success', 'true') } catch {}
                await fetch('/api/debug/manual-subscription-update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user?.id, subscriptionStatus: 'active' })
                })
              }
            } catch (e) {
              console.error('Checkout event handling failed', e)
            }
          }
        })
        if (!paddle || !paddle.Checkout) {
          throw new Error('Paddle initialization failed')
        }
        await paddle.Checkout.open({
          items: [{ priceId: pub.priceId, quantity: 1 }],
          settings: { displayMode: 'overlay' },
          customer: user?.email ? { email: user.email } : undefined,
          customData: user ? { user_id: user.id, user_email: user.email } : undefined
        })
      } else {
        // Fallback to settings page
        window.location.href = '/settings?tab=billing'
      }
    } catch (error) {
      console.error('Error handling upgrade:', error)
      // Fallback to settings page
      window.location.href = '/settings?tab=billing'
    } finally {
      setIsUpgrading(false)
    }
  }

  return {
    showUpgradePrompt,
    trialTimeRemaining,
    isUpgrading,
    handleUpgrade
  }
}
