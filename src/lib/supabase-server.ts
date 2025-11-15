import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function createClient(request?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // For API routes, use request cookies directly
  // For server components, use cookies() from next/headers
  if (request) {
    // API route - use request cookies
    return createServerClient(supabaseUrl || '', supabaseAnonKey || '', {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Cookies will be set on the response in the API route
          // This is handled by the middleware or response
        },
      },
    })
  }

  // Server component - use cookies() from next/headers
  const cookieStore = await cookies()
  
  console.log('Supabase server client created:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey,
    cookieCount: cookieStore.getAll().length,
    fromRequest: false
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Please set up your environment variables.')
    // During build, return a stub instead of throwing
    // This will fail at runtime but allows build to complete
    return createServerClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op during build
          },
        },
      }
    )
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
