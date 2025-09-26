import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.PADDLE_API_KEY
    const testEmail = 'test@example.com' // Use a test email first
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'No API key found'
      })
    }

    console.log('Testing customer search functionality...')

    // Test 1: Try to list customers
    try {
      const customers = await paddleAPI.listCustomers({ limit: 5 })
      console.log('✅ Customer list works:', customers.data?.length || 0, 'customers found')
    } catch (listError) {
      console.error('❌ Customer list failed:', listError)
      return NextResponse.json({
        success: false,
        error: 'Customer list failed',
        details: listError instanceof Error ? listError.message : 'Unknown error'
      })
    }

    // Test 2: Try to search for a specific email
    try {
      const searchResult = await paddleAPI.getCustomerByEmail(testEmail)
      console.log('✅ Customer search works:', searchResult ? 'Found' : 'Not found')
    } catch (searchError) {
      console.error('❌ Customer search failed:', searchError)
      return NextResponse.json({
        success: false,
        error: 'Customer search failed',
        details: searchError instanceof Error ? searchError.message : 'Unknown error'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Customer search functionality is working',
      tests: {
        listCustomers: '✅ Working',
        getCustomerByEmail: '✅ Working'
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
