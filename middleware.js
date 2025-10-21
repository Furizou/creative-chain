import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Refresh session if expired
  await supabase.auth.getSession();

  // Protect authenticated routes - redirect unauthenticated users to login
  const protectedPagePaths = ['/upload', '/dashboard', '/creator', '/profile'];
  const path = req.nextUrl.pathname;
  
  // Check if this is a protected page (not API route)
  const isProtectedPage = protectedPagePaths.some(p => path.startsWith(p) && !path.startsWith('/api'));
  
  if (isProtectedPage) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Redirect unauthenticated users to login page
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return res;
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
