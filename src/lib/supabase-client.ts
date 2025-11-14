import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  
  // Validate environment variables are present and not empty
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.length === 0 || supabaseAnonKey.length === 0) {
    console.error('Supabase environment variables are missing or empty:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0
    })
    
    // In production, we should still create a client but it will fail at runtime
    // This prevents build-time errors while allowing runtime error detection
    if (typeof window !== 'undefined') {
      console.error('⚠️ Supabase credentials missing in browser. Check Vercel environment variables.')
    }
    
    // Return a client that will fail gracefully with clear errors
    return createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    )
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
