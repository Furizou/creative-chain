import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  let res = NextResponse.next()

  // Check if Supabase is properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, allow all requests (development mode)
  if (!supabaseUrl || !supabaseAnonKey ||
      supabaseUrl === 'your_supabase_url_here' ||
      supabaseAnonKey === 'your_supabase_anon_key_here') {

    console.warn('⚠️  Supabase not configured - authentication middleware disabled');
    return res
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({
          request: req,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        )
      },
    },
  })

  const { pathname } = req.nextUrl

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/marketplace',
    '/works',
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/logout'
  ]

  // API paths that require authentication
  const protectedApiPaths = [
    '/api/profile',
    '/api/creative-works',
    '/api/license-offerings',
    '/api/licenses',
    '/api/payments',
    '/api/wallet',
    '/api/royalty-splits',
    '/api/blockchain'
  ]

  // Dashboard paths that require authentication
  const protectedPaths = [
    '/creator',
    '/creator',
    '/profile',
    '/upload',
    '/test-db',
    '/test-final-db'
  ]

  // Check if current path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isProtectedApiPath = protectedApiPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path => 
    pathname === path || 
    (path.endsWith('/') && pathname.startsWith(path)) ||
    pathname.startsWith('/works/') || // Allow viewing individual works
    pathname.startsWith('/marketplace/') // Allow viewing marketplace items
  )

  // If Supabase is not configured, only protect certain routes in development
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
    // In development mode without Supabase, only block access to test-auth and very sensitive routes
    if (pathname === '/test-auth') {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('message', 'Configure Supabase to test authentication')
      return NextResponse.redirect(redirectUrl)
    }
    
    // Allow everything else in development mode
    return res
  }

  // Skip middleware auth checks - we're using client-side only auth
  // The middleware can't access localStorage where the session is stored
  // Protected routes will be handled client-side by the useAuth hook
  console.log('✅ Middleware: Skipping auth check (using client-side auth)')

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}