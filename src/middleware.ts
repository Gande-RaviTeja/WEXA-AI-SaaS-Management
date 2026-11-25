import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'stockflow-session'

const PROTECTED = ['/dashboard', '/products', '/settings']
const AUTH_ROUTES = ['/login', '/signup']

function getSecret() {
  const secret = process.env.SESSION_SECRET ?? ''
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verify session
  let isAuthenticated = false
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (token) {
      await jwtVerify(token, getSecret())
      isAuthenticated = true
    }
  } catch {
    isAuthenticated = false
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p))

  // Redirect root
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(isAuthenticated ? '/dashboard' : '/login', request.url),
    )
  }

  // Support easy logout via /logout URL
  if (pathname === '/logout') {
    return NextResponse.redirect(new URL('/api/auth/logout', request.url))
  }

  // Guard protected routes
  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect already-logged-in users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/products/:path*', '/settings/:path*', '/login', '/signup', '/logout'],
}
