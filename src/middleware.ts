import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const locales = ['en', 'es', 'de', 'fr', 'zh', 'ja', 'ko', 'it', 'ar', 'nl']
const defaultLocale = 'en'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Guard against missing environment variables and handle Supabase auth
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()
    } catch (error) {
      // Log error but don't fail the middleware - continue with locale handling
      console.error('Middleware Supabase error:', error)
    }
  } else {
    console.warn('Missing Supabase environment variables in middleware - skipping auth check')
  }

  // Handle locale routing
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
    return supabaseResponse
  }

  // If pathname doesn't have a locale, redirect to default locale
  if (!pathnameHasLocale && pathname !== '/') {
    // Try to get locale from cookie
    const locale = request.cookies.get('NEXT_LOCALE')?.value || defaultLocale
    const newUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url)
    return NextResponse.redirect(newUrl)
  }

  // Store locale in response for use in components
  const currentLocale = pathnameHasLocale 
    ? pathname.split('/')[1] 
    : defaultLocale
  
  supabaseResponse.cookies.set('NEXT_LOCALE', currentLocale)

  return supabaseResponse
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
