import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  
  // Log environment variable status in browser for debugging
  if (typeof window !== 'undefined') {
    console.log('🔍 Supabase Client Initialization:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
      keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0
    })
  }
  
  // Validate environment variables are present and not empty
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.length === 0 || supabaseAnonKey.length === 0) {
    const errorMsg = 'Supabase environment variables are missing or empty'
    console.error('❌', errorMsg, {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0,
      isBrowser: typeof window !== 'undefined'
    })
    
    if (typeof window !== 'undefined') {
      console.error('⚠️ Supabase credentials missing in browser. Check Vercel environment variables.')
      console.error('💡 Make sure variables have NEXT_PUBLIC_ prefix and are enabled for Production')
    }
    
    // Return a client that will fail gracefully with clear errors
    return createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    )
  }
  
  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl)
    console.error('💡 URL should be: https://your-project-id.supabase.co')
  }
  
  // Validate key format (JWT tokens start with eyJ)
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.warn('⚠️ Supabase key format looks unusual. Expected JWT token starting with "eyJ"')
  }
  
  if (typeof window !== 'undefined') {
    console.log('✅ Supabase client created successfully')
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
