import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // TODO: Replace with Laravel API auth check (Fase 6)
  // Temporarily allow all requests through while migrating from Supabase

  const protectedPaths = ['/dashboard', '/inbox', '/contacts', '/pipelines', '/broadcasts', '/automations', '/settings']

  // Check for auth token in cookies
  const token = request.cookies.get('auth_token')?.value

  // Auth pages - redirect to dashboard if already logged in
  if (token && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname === '/forgot-password'
  )) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Protected pages - redirect to login if not authenticated
  if (!token && protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
