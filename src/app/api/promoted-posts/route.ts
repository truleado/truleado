import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch promoted posts for the user
    const { data: posts, error } = await supabase
      .from('promoted_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching promoted posts:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error('Error in promoted-posts GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, subreddit, title, body: postBody, post_type } = body

    // Validate required fields
    if (!product_id || !subreddit || !title || !postBody || !post_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate post_type
    const validTypes = ['educational', 'problem-solution', 'community', 'promotional']
    if (!validTypes.includes(post_type)) {
      return NextResponse.json({ error: 'Invalid post type' }, { status: 400 })
    }

    // Insert the promoted post
    const { data: post, error } = await supabase
      .from('promoted_posts')
      .insert({
        id: uuidv4(),
        user_id: user.id,
        product_id,
        subreddit,
        title,
        body: postBody,
        post_type
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating promoted post:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error in promoted-posts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
