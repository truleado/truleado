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
        client_id: '1000.82DRWH7GU91XIPF7ZN9Q3W9KZ770GY',
        client_secret: '30c61a291d791a0d1caa6e2ce193d069be007d6ea9',
        refresh_token: '1000.1aa3bd63937b5fb65d8e970165babc99.4df927f0368af5b8807bea0ee715c8cb',
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
