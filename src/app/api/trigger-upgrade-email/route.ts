import { NextRequest, NextResponse } from 'next/server'
import { sendUpgradeThankYouEmail } from '@/lib/upgrade-email-service'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('Triggering upgrade email for:', email, 'name:', name)

    const emailResult = await sendUpgradeThankYouEmail(email, name || 'User', 'Pro')

    if (emailResult.success) {
      console.log('✅ Upgrade email sent successfully to:', email)
      return NextResponse.json({
        success: true,
        message: 'Upgrade thank you email sent successfully',
        emailId: emailResult.result?.emailId
      })
    } else {
      console.error('❌ Failed to send upgrade email:', emailResult.error)
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send upgrade email'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error triggering upgrade email:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
