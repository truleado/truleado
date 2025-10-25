import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No active products found' }, { status: 400 })
    }

    // Check Reddit connection
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_token_expires_at')
      .eq('user_id', user.id)
      .single()

    if (apiKeysError || !apiKeys?.reddit_access_token) {
      return NextResponse.json({ error: 'Reddit not connected' }, { status: 400 })
    }

    // Check if token is expired
    if (apiKeys.reddit_token_expires_at) {
      const expiresAt = new Date(apiKeys.reddit_token_expires_at)
      if (expiresAt <= new Date()) {
        return NextResponse.json({ error: 'Reddit token expired' }, { status: 400 })
      }
    }

    // For now, we'll just return success
    // In a real implementation, this would trigger the lead discovery process
    // which would monitor Reddit for relevant discussions

    return NextResponse.json({
      success: true,
      message: 'Lead discovery started successfully',
      products_count: products.length,
      reddit_connected: true
    })

  } catch (error) {
    console.error('Error starting lead discovery:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to start lead discovery'
    }, { status: 500 })
  }
}