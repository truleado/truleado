// Email service using server-side API (no CORS issues)
export async function sendWelcomeEmailDirect(email: string, name: string) {
  try {
    console.log('📧 Sending welcome email to:', email, 'for:', name)
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name
      }),
    })

    console.log('📧 API response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Welcome email sent successfully:', result)
      return { success: true, result }
    } else {
      const errorText = await response.text()
      console.error('❌ Welcome email failed:', response.status, errorText)
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }
  } catch (error) {
    console.error('❌ Welcome email error:', error)
    return { success: false, error: error.message }
  }
}
