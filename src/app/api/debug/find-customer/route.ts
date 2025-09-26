import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Searching for all customers to find the right one...')

    // Get all customers (up to 50)
    const allCustomers = paddleAPI.listCustomers({ limit: 50 })
    console.log('Found customers:', allCustomers.data?.length || 0)

    const customers = allCustomers.data || []
    
    // Show all customers with their details
    const customerList = customers.map(customer => ({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      status: customer.status,
      createdAt: customer.createdAt
    }))

    // Look for customers that might match (case insensitive)
    const url = new URL(request.url)
    const searchEmail = url.searchParams.get('email')
    
    let matchingCustomers = []
    if (searchEmail) {
      matchingCustomers = customers.filter(customer => 
        customer.email && customer.email.toLowerCase().includes(searchEmail.toLowerCase())
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Customer search completed',
      totalCustomers: customers.length,
      customers: customerList,
      searchEmail: searchEmail,
      matchingCustomers: matchingCustomers.map(c => ({
        id: c.id,
        email: c.email,
        name: c.name
      })),
      instructions: {
        note: 'Add ?email=partial-email to search for customers with matching email',
        nextSteps: [
          '1. Look through the customer list above',
          '2. Find your customer by email',
          '3. Use the customer ID in the direct test',
          '4. Or add ?email=your-email to filter results'
        ]
      }
    })

  } catch (error) {
    console.error('Customer search failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
