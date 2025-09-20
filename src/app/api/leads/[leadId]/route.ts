import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = await params

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    // Verify the lead belongs to the user and delete it
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Lead deleted successfully' })
  } catch (error) {
    console.error('Lead deletion error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete lead'
    }, { status: 500 })
  }
}
