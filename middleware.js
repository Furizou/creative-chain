import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
          response = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - this is important!
  const { data: { session } } = await supabase.auth.getSession();

  // Protect authenticated routes - redirect unauthenticated users to login
  const protectedPagePaths = ['/upload', '/dashboard', '/creator', '/profile'];
  const path = req.nextUrl.pathname;

  // Check if this is a protected page (not API route)
  const isProtectedPage = protectedPagePaths.some(p => path.startsWith(p) && !path.startsWith('/api'));

  if (isProtectedPage && !session) {
    // Redirect unauthenticated users to login page
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Protect these pages (require login to access)
    '/upload',
    '/dashboard/:path*',
    '/creator/:path*',
    '/profile/:path*',
  ],
};
