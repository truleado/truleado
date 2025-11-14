export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing simple database operations...')
    
    const supabase = await createClient()
    
    // Test 1: Basic connection
    console.log('Test 1: Basic connection')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (profilesError) {
      return NextResponse.json({ 
        success: false,
        error: 'Basic connection failed',
        details: profilesError.message,
        code: profilesError.code
      })
    }
    
    console.log('✅ Basic connection successful')
    
    // Test 2: Check if we have any data
    console.log('Test 2: Check existing data')
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(5)
    
    if (productsError) {
      return NextResponse.json({ 
        success: false,
        error: 'Products query failed',
        details: productsError.message,
        code: productsError.code
      })
    }
    
    console.log(`✅ Found ${existingProducts?.length || 0} existing products`)
    
    // Test 3: Check leads
    const { data: existingLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, title')
      .limit(5)
    
    if (leadsError) {
      return NextResponse.json({ 
        success: false,
        error: 'Leads query failed',
        details: leadsError.message,
        code: leadsError.code
      })
    }
    
    console.log(`✅ Found ${existingLeads?.length || 0} existing leads`)
    
    // Test 4: Check authentication
    console.log('Test 4: Check authentication')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth status:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    })
    
    return NextResponse.json({
      success: true,
      message: 'All tests completed successfully',
      results: {
        basicConnection: '✅ Success',
        existingProducts: existingProducts?.length || 0,
        existingLeads: existingLeads?.length || 0,
        authentication: user ? `✅ User: ${user.email}` : '❌ No user',
        authError: authError?.message || 'None'
      },
      data: {
        products: existingProducts || [],
        leads: existingLeads || []
      }
    })
    
  } catch (error) {
    console.error('❌ Simple test error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Simple test failed', 
      details: error.message 
    })
  }
}
