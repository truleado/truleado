import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test Reddit's public API (no authentication required)
    const response = await fetch('https://www.reddit.com/r/test/hot.json?limit=1', {
      headers: {
        'User-Agent': 'Truleado Lead Discovery Bot 1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      message: 'Reddit public API test successful',
      success: true,
      samplePost: data.data?.children?.[0]?.data || null,
      totalPosts: data.data?.children?.length || 0
    })
  } catch (error) {
    console.error('Reddit public API test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to test Reddit public API',
      success: false
    }, { status: 500 })
  }
}
