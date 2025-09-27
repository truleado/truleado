// Upgrade thank you email service
export async function sendUpgradeThankYouEmail(email: string, name: string, planType: string = 'Pro') {
  try {
    console.log('📧 Sending upgrade thank you email to:', email, 'for:', name)
    
    const response = await fetch('/api/send-upgrade-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        planType
      }),
    })

    console.log('📧 Upgrade email API response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Upgrade thank you email sent successfully:', result)
      return { success: true, result }
    } else {
      const errorText = await response.text()
      console.error('❌ Upgrade thank you email failed:', response.status, errorText)
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }
  } catch (error) {
    console.error('❌ Upgrade thank you email error:', error)
    return { success: false, error: error.message }
  }
}
