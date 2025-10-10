import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    // Split full name into first and last name
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0] || 'User'
    const lastName = nameParts.slice(1).join(' ') || ''

    console.log('Creating Zoho contact:', { firstName, lastName, email })

    // Get access token
    const tokenResponse = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ZOHO_CLIENT_ID || '',
        client_secret: process.env.ZOHO_CLIENT_SECRET || '',
        refresh_token: process.env.ZOHO_REFRESH_TOKEN || '',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token generation failed:', errorText)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to get access token', 
        details: errorText 
      }, { status: 500 })
    }

    const tokenData = await tokenResponse.json()
    console.log('Access token received')

    // Create contact in Zoho CRM
    const contactData = {
      First_Name: firstName,
      Last_Name: lastName,
      Email: email,
      Lead_Source: 'Truleado Website',
      Lead_Status: 'Not Contacted',
      Company: 'Individual',
      Description: `New user signup from Truleado - ${name} (${email})`
    }

    const contactResponse = await fetch('https://www.zohoapis.in/crm/v2/Contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [contactData]
      }),
    })

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text()
      console.error('Contact creation failed:', errorText)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create contact', 
        details: errorText 
      }, { status: 500 })
    }

    const result = await contactResponse.json()
    console.log('Contact created successfully:', result.data[0]?.details?.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Contact created successfully in Zoho CRM',
      contactId: result.data[0]?.details?.id
    })
  } catch (error) {
    console.error('Error creating Zoho contact:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
