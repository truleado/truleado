import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { zohoCRMService } from '@/lib/zoho-crm-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Check if contact already exists in Zoho
    const searchResult = await zohoCRMService.searchContactByEmail(user.email!)
    
    if (searchResult.success && searchResult.contactId) {
      console.log('Contact already exists in Zoho CRM:', searchResult.contactId)
      return NextResponse.json({
        success: true,
        message: 'Contact already exists in Zoho CRM',
        contactId: searchResult.contactId,
        action: 'existing'
      })
    }

    // Create new contact in Zoho CRM
    const contactResult = await zohoCRMService.createContact({
      firstName: user.user_metadata?.full_name?.split(' ')[0] || 'User',
      lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
      email: user.email!,
      phone: profile.phone || '',
      company: profile.company || 'Individual',
      userId: user.id,
      signupDate: new Date().toISOString(),
      trialStatus: profile.subscription_status || 'trial'
    })

    if (contactResult.success) {
      // Update user profile with Zoho contact ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          zoho_contact_id: contactResult.contactId,
          zoho_contact_created_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile with Zoho contact ID:', updateError)
        // Don't fail the request, contact was created successfully
      }

      return NextResponse.json({
        success: true,
        message: 'Contact created successfully in Zoho CRM',
        contactId: contactResult.contactId,
        action: 'created'
      })
    } else {
      console.error('Failed to create Zoho contact:', contactResult.error)
      return NextResponse.json({
        success: false,
        error: contactResult.error || 'Failed to create contact in Zoho CRM'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in create-contact:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
