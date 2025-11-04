import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { TrialManager } from '@/lib/trial-manager'

export async function POST(request: NextRequest) {
  // Free trials are no longer available - users must pay before using the product
  return NextResponse.json({ 
    error: 'Free trials are no longer available',
    message: 'Please subscribe to access the product. Visit /settings?tab=billing to upgrade.'
  }, { status: 403 })
}
