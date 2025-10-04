import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Use the same database connection as other APIs
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Delete the product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (deleteError) {
      console.error('Error deleting product:', deleteError)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    // Also delete associated leads
    const { error: leadsDeleteError } = await supabase
      .from('leads')
      .delete()
      .eq('product_id', productId)

    if (leadsDeleteError) {
      console.error('Error deleting associated leads:', leadsDeleteError)
      // Don't fail the request if leads deletion fails
    }

    // Also delete associated background jobs
    const { error: jobsDeleteError } = await supabase
      .from('background_jobs')
      .delete()
      .eq('product_id', productId)

    if (jobsDeleteError) {
      console.error('Error deleting associated jobs:', jobsDeleteError)
      // Don't fail the request if jobs deletion fails
    }

    console.log(`Product ${productId} deleted successfully`)

    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    })

  } catch (error) {
    console.error('Error in delete product API:', error)
    return NextResponse.json({ 
      error: 'Failed to delete product' 
    }, { status: 500 })
  }
}