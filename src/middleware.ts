import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const locales = ['en', 'es', 'de', 'fr', 'zh', 'ja', 'ko', 'it', 'ar', 'nl']
const defaultLocale = 'en'

export async function middleware(request: NextRequest) {
  // Create base response first
  let response = NextResponse.next({
    request,
  })

  try {
    // Guard against missing environment variables and handle Supabase auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

    // Validate env vars are not just empty strings
    if (supabaseUrl && supabaseAnonKey && supabaseUrl.length > 0 && supabaseAnonKey.length > 0) {
      try {
        // Create Supabase client with timeout protection
        const supabase = createServerClient(
          supabaseUrl,
          supabaseAnonKey,
          {
            cookies: {
              getAll() {
                try {
                  return request.cookies.getAll()
                } catch (e) {
                  return []
                }
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value)
                  })
                  // Create new response with updated cookies
                  response = NextResponse.next({ request })
                  cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options)
                  })
                } catch (e) {
                  // Silently fail cookie operations
                }
              },
            },
          }
        )

        // Get user with timeout protection
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          // User fetched successfully, continue
        } catch (authError) {
          // Auth error is not critical, continue
        }
      } catch (error) {
        // Supabase initialization error - non-critical, continue
      }
    }

    // Handle locale routing
    try {
      const { pathname } = request.nextUrl
      const pathnameHasLocale = locales.some(
        locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
      )

      // Skip locale handling for API routes, auth routes, and static files
      if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/robots.txt') ||
        pathname.startsWith('/sitemap') ||
        pathname.includes('.') ||
        pathname === '/dashboard' ||
        pathname === '/research' ||
        pathname === '/reddit-leads' ||
        pathname === '/track-leads' ||
        pathname === '/settings' ||
        pathname.startsWith('/products') ||
        pathname.startsWith('/promote')
      ) {
        return response
      }

      // If pathname doesn't have a locale, redirect to default locale
      if (!pathnameHasLocale && pathname !== '/') {
        try {
          // Try to get locale from cookie, validate it's in the locales array
          const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
          const locale = cookieLocale && locales.includes(cookieLocale) ? cookieLocale : defaultLocale
          
          // Validate the locale is safe before using it in URL
          if (locales.includes(locale)) {
            const newUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url)
            return NextResponse.redirect(newUrl)
          }
        } catch (error) {
          // If URL construction fails, just return the response without redirect
        }
      }

      // Store locale in response for use in components
      const currentLocale = pathnameHasLocale 
        ? (pathname.split('/')[1] || defaultLocale)
        : defaultLocale
      
      // Validate locale before setting cookie
      if (locales.includes(currentLocale)) {
        try {
          response.cookies.set('NEXT_LOCALE', currentLocale)
        } catch (error) {
          // If cookie setting fails, continue without cookie
        }
      }
    } catch (localeError) {
      // Locale handling error - non-critical, continue with base response
    }

    return response
  } catch (error) {
    // Catch any unexpected errors and return a basic response
    return NextResponse.next({
      request,
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
