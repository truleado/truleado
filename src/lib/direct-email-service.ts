// Direct email service that works in the browser
export async function sendWelcomeEmailDirect(email: string, name: string) {
  try {
    console.log('📧 Sending welcome email to:', email)
    
    const response = await fetch('/api/send-welcome-email-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        trialEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Welcome email sent successfully:', result)
      return { success: true, result }
    } else {
      const error = await response.text()
      console.warn('❌ Welcome email failed:', error)
      return { success: false, error }
    }
  } catch (error) {
    console.warn('❌ Welcome email error:', error)
    return { success: false, error: error.message }
  }
}
