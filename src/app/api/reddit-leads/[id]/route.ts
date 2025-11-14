export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ Deleting Reddit lead:', params.id)
    
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'Please log in to delete Reddit leads'
      }, { status: 401 })
    }

    // Delete the Reddit lead (with user_id check for security)
    const { error: deleteError } = await supabase
      .from('reddit_leads')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting Reddit lead:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete Reddit lead',
        details: deleteError.message
      }, { status: 500 })
    }

    console.log('Reddit lead deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Reddit lead deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Reddit lead delete error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete Reddit lead', 
      details: error.message 
    }, { status: 500 })
  }
}
