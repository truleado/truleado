import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await params

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, website, features, benefits, painPoints, idealCustomerProfile, subreddits } = body

    // Verify the product belongs to the user before updating
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 })
    }

    // Update the product
    const { data, error: updateError } = await supabase
      .from('products')
      .update({
        name,
        description,
        website_url: website,
        features,
        benefits,
        pain_points: painPoints,
        ideal_customer_profile: idealCustomerProfile,
        subreddits,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('user_id', user.id) // Ensure RLS is respected
      .select()
      .single()

    if (updateError) {
      console.error('Database error updating product:', updateError)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({ product: data }, { status: 200 })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update product'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await params

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Verify the product belongs to the user before deleting
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 })
    }

    // Stop associated background jobs (but don't delete them yet)
    const { error: jobStopError } = await supabase
      .from('background_jobs')
      .update({ 
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('user_id', user.id)

    if (jobStopError) {
      console.error('Error stopping background jobs:', jobStopError)
      // Continue with product deletion even if job stopping fails
    }

    // Keep the leads - don't delete them
    // This allows users to retain their lead history even after deleting the product

    // Delete the product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', user.id) // Ensure RLS is respected

    if (deleteError) {
      console.error('Database error deleting product:', deleteError)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete product'
    }, { status: 500 })
  }
}
