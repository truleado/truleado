import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('Checking leads in database...')
    
    const supabase = await createClient()
    
    // Check all leads in the database
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(10)
    
    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch leads', 
        details: leadsError.message 
      })
    }

    console.log(`Found ${leads?.length || 0} leads in database`)
    
    // Check products too
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, user_id')
      .limit(10)
    
    if (productsError) {
      console.error('Error fetching products:', productsError)
    }

    console.log(`Found ${products?.length || 0} products in database`)

    return NextResponse.json({
      success: true,
      leadsCount: leads?.length || 0,
      productsCount: products?.length || 0,
      leads: leads || [],
      products: products || []
    })

  } catch (error) {
    console.error('Error in check-leads:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Check failed', 
      details: error.message 
    })
  }
}