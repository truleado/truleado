import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing customer search step by step...')

    // Test 1: Try to list customers without any filters
    try {
      console.log('Step 1: Testing basic customer list...')
      const allCustomers = paddleAPI.listCustomers({ limit: 5 })
      console.log('✅ Basic list works:', allCustomers.data?.length || 0, 'customers found')
    } catch (error) {
      console.error('❌ Basic list failed:', error)
      return NextResponse.json({
        success: false,
        error: 'Basic customer list failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Try to search for a specific email
    try {
      console.log('Step 2: Testing email search...')
      const searchResult = await paddleAPI.getCustomerByEmail('test@example.com')
      console.log('✅ Email search works:', searchResult ? 'Found customer' : 'No customer found')
    } catch (error) {
      console.error('❌ Email search failed:', error)
      return NextResponse.json({
        success: false,
        error: 'Email search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: Try to search for a real email (if we can get it from the request)
    const url = new URL(request.url)
    const testEmail = url.searchParams.get('email')
    
    if (testEmail) {
      try {
        console.log('Step 3: Testing with real email:', testEmail)
        const realSearchResult = await paddleAPI.getCustomerByEmail(testEmail)
        console.log('✅ Real email search works:', realSearchResult ? 'Found customer' : 'No customer found')
        
        return NextResponse.json({
          success: true,
          message: 'All customer search tests passed',
          results: {
            basicList: '✅ Working',
            emailSearch: '✅ Working',
            realEmailSearch: realSearchResult ? '✅ Found customer' : '❌ No customer found',
            customer: realSearchResult ? {
              id: realSearchResult.id,
              email: realSearchResult.email,
              name: realSearchResult.name
            } : null
          }
        })
      } catch (error) {
        console.error('❌ Real email search failed:', error)
        return NextResponse.json({
          success: false,
          error: 'Real email search failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Basic customer search tests passed',
      note: 'Add ?email=your-email@example.com to test with a real email',
      results: {
        basicList: '✅ Working',
        emailSearch: '✅ Working'
      }
    })

  } catch (error) {
    console.error('Customer test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
