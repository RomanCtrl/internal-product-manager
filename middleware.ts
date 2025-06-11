import { createServerClient } from '@supabase/ssr'
 import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

console.log('[Middleware File] This log is at the very top of src/middleware.ts'); // New top-level log

export async function updateSession(request: NextRequest) {
  console.log('[Middleware Function] updateSession called');
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add custom header
  response.headers.set('x-custom-middleware-test', 'executed');
  console.log('[Middleware] Set x-custom-middleware-test header.'); // Log for our reference

  console.log('[Middleware] Initial response created and header set.');

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Important: Re-create response if cookies are set, so header is preserved
          const newHeaders = new Headers(response.headers); // Clone existing headers
          response = NextResponse.next({ 
            request: {
              headers: request.headers, // Original request headers
            },
          });
          newHeaders.forEach((val, key) => response.headers.set(key, val)); // Copy old headers back
          response.cookies.set({ // Then set cookies on the new response
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          // Important: Re-create response if cookies are removed
          const newHeaders = new Headers(response.headers);
          response = NextResponse.next({ 
            request: {
              headers: request.headers,
            },
          });
          newHeaders.forEach((val, key) => response.headers.set(key, val));
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  )
  console.log('[Middleware] Supabase client created.'); // New log

  // Refresh session if expired
  const { data: { user }, error: getUserError } = await supabase.auth.getUser()

  if (getUserError) {
    console.error('[Middleware] Error getting user:', getUserError.message); // New log
  }
  console.log('[Middleware] User object:', user ? `User ID: ${user.id}` : 'No user'); // New log

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/products', '/cart', '/orders']
  const authRoutes = ['/login', '/register', '/auth']
  const { pathname } = request.nextUrl

  console.log(`[Middleware] Request pathname: ${pathname}`); // New log

  // Redirect to login if accessing the root path or a protected route without authentication
  if (!user && (pathname === '/' || protectedRoutes.some(route => pathname.startsWith(route)))) {
    console.log('[Middleware] Condition met: Not user AND (root path OR protected route). Redirecting to /login.'); // New log
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to products if accessing auth pages while logged in
  if (user && authRoutes.some(route => pathname.startsWith(route))) {
    console.log('[Middleware] Condition met: User AND auth route. Redirecting to /products.'); // New log
    return NextResponse.redirect(new URL('/products', request.url))
  }

  console.log('[Middleware] No redirection conditions met. Proceeding with next().'); // New log
  return response
}
