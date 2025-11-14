export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...')
    
    const supabase = await createClient()
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('Database connection error:', testError)
      return NextResponse.json({ 
        success: false,
        error: 'Database connection failed',
        details: testError.message 
      })
    }
    
    console.log('✅ Database connection successful')
    
    // Test UUID generation
    const testUuid = '00000000-0000-0000-0000-000000000000'
    console.log('Testing UUID format:', testUuid)
    
    // Test if we can create a simple record
    const { data: insertTest, error: insertError } = await supabase
      .from('products')
      .insert([{
        user_id: testUuid,
        name: 'Test Product',
        description: 'Test Description',
        website_url: 'https://test.com',
        features: ['test'],
        benefits: ['test'],
        pain_points: ['test'],
        ideal_customer_profile: 'test',
        subreddits: ['test'],
        status: 'active'
      }])
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert test error:', insertError)
      return NextResponse.json({ 
        success: false,
        error: 'Insert test failed',
        details: insertError.message,
        code: insertError.code
      })
    }
    
    console.log('✅ Insert test successful:', insertTest.id)
    
    // Clean up test record
    await supabase
      .from('products')
      .delete()
      .eq('id', insertTest.id)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection and UUID test successful',
      testUuid: testUuid,
      insertedId: insertTest.id
    })
    
  } catch (error) {
    console.error('❌ Database test error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Database test failed', 
      details: error.message 
    })
  }
}
