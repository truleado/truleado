export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Logging in test user...')
    
    const supabase = await createClient()
    
    // Login with test user credentials
    const testEmail = 'test@truleado.com'
    const testPassword = 'testpassword123'
    
    console.log('Attempting to login with test user...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (authError) {
      console.error('Login error:', authError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to login test user',
        details: authError.message 
      })
    }
    
    console.log('✅ Test user logged in successfully:', authData.user?.id)
    
    // Now check if we can access leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', authData.user?.id)
    
    if (leadsError) {
      console.error('Leads fetch error:', leadsError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch leads after login',
        details: leadsError.message 
      })
    }
    
    console.log(`✅ Found ${leads?.length || 0} leads for logged in user`)
    
    // Also check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', authData.user?.id)
    
    if (productsError) {
      console.error('Products fetch error:', productsError)
    }
    
    console.log(`✅ Found ${products?.length || 0} products for logged in user`)
    
    return NextResponse.json({
      success: true,
      message: 'Test user logged in successfully',
      user: {
        id: authData.user?.id,
        email: authData.user?.email
      },
      data: {
        leads: leads || [],
        products: products || []
      },
      counts: {
        leads: leads?.length || 0,
        products: products?.length || 0
      },
      instructions: {
        nextSteps: 'The test user is now logged in. Refresh the /leads page to see the data.',
        note: 'This login is for testing only and will expire when the session ends.'
      }
    })
    
  } catch (error) {
    console.error('❌ Test user login error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Test user login failed', 
      details: error.message 
    })
  }
}
