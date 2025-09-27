// Simple email service using API endpoint
export async function sendWelcomeEmailDirect(email: string, name: string) {
  try {
    console.log('📧 Sending welcome email to:', email)
    
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name
      }),
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ Welcome email sent successfully:', result)
      return { success: true, result }
    } else {
      console.warn('❌ Welcome email failed:', result)
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.warn('❌ Welcome email error:', error)
    return { success: false, error: error.message }
  }
}
