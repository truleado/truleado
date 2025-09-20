import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test data isolation by checking what data this user can see
    const [
      { data: products, error: productsError },
      { data: leads, error: leadsError },
      { data: backgroundJobs, error: jobsError },
      { data: apiKeys, error: apiKeysError }
    ] = await Promise.all([
      supabase.from('products').select('id, name, user_id').eq('user_id', user.id),
      supabase.from('leads').select('id, title, user_id').eq('user_id', user.id),
      supabase.from('background_jobs').select('id, status, user_id').eq('user_id', user.id),
      supabase.from('api_keys').select('id, user_id').eq('user_id', user.id)
    ])

    // Also test if user can see other users' data (this should return empty)
    const { data: otherUsersProducts, error: otherUsersError } = await supabase
      .from('products')
      .select('id, name, user_id')
      .neq('user_id', user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      userData: {
        products: products || [],
        leads: leads || [],
        backgroundJobs: backgroundJobs || [],
        apiKeys: apiKeys || []
      },
      dataIsolation: {
        canSeeOtherUsersData: (otherUsersProducts || []).length > 0,
        otherUsersProductsCount: (otherUsersProducts || []).length,
        otherUsersError: otherUsersError?.message
      },
      errors: {
        products: productsError?.message,
        leads: leadsError?.message,
        jobs: jobsError?.message,
        apiKeys: apiKeysError?.message
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Debug failed'
    }, { status: 500 })
  }
}
