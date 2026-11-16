import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { requireEnv } from './lib/supabase/env'

/** Reachable without a session. Allows visitors to view the platform before signing in. */
const PROTECTED_ROUTES = [
  '/settings',
  '/notifications',
  '/c/new',
  '/onboarding',
]

/** Signed-in members should not see these. */
const GUEST_ONLY_ROUTES = ['/login', '/signup', '/forgot-password']

/** Real static assets. */
const STATIC_FILE = /\.(?:avif|css|gif|ico|jpe?g|js|json|map|png|svg|txt|webp|woff2?|ttf)$/i

function isProtected(pathname: string) {
  if (PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true
  }
  if (pathname.includes('/admin')) {
    return true
  }
  return false
}

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || STATIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
      requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && isProtected(pathname)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', `${pathname}${search}`)
      return NextResponse.redirect(loginUrl)
    }

    if (user && matchesRoute(pathname, GUEST_ONLY_ROUTES)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (err) {
    // Fallback gracefully on network / auth exceptions so deployment never 500s
    console.error('[Proxy Edge Middleware Error]', err)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
