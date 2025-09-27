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

    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`
    const filePath = `logos/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath)

    const logoUrl = urlData.publicUrl

    // Update user profile with logo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: logoUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Don't fail the request, file was uploaded successfully
    }

    return NextResponse.json({
      success: true,
      logoUrl,
      message: 'Logo uploaded successfully'
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile to find logo URL
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Remove logo from storage if it exists
    if (profile.avatar_url) {
      // Extract file path from URL
      const url = new URL(profile.avatar_url)
      const pathParts = url.pathname.split('/')
      const filePath = pathParts.slice(-2).join('/') // Get 'logos/filename'

      const { error: deleteError } = await supabase.storage
        .from('logos')
        .remove([filePath])

      if (deleteError) {
        console.error('Storage delete error:', deleteError)
        // Continue with profile update even if storage delete fails
      }
    }

    // Update profile to remove logo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to remove logo from profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Logo removed successfully'
    })

  } catch (error) {
    console.error('Logo removal error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
