import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request)
    
    // Refresh session if expired
    const { data: { session }, error } = await supabase.auth.getSession()

    // Define protected routes
    const protectedRoutes = ['/dashboard', '/cart', '/orders', '/profile']
    const authRoutes = ['/login', '/signup']
    
    const isProtectedRoute = protectedRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    )
    
    const isAuthRoute = authRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    )

    // Redirect to login if accessing protected route without session
    if (isProtectedRoute && !session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect to dashboard if accessing auth pages while logged in
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (e) {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
