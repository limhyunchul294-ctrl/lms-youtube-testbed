import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/courses', '/course', '/lesson', '/activity', '/admin']
const AUTH_PAGES = ['/', '/auth/gsw', '/auth/complete']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
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

  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p))
  const isAuthPage = AUTH_PAGES.includes(path) || path.startsWith('/auth/')

  const gswOnly = process.env.GSW_BRIDGE_ONLY === 'true'
  const portalUrl = process.env.NEXT_PUBLIC_GSW_PORTAL_URL

  if (gswOnly && path === '/' && !user) {
    if (portalUrl) {
      const login = new URL(portalUrl)
      login.searchParams.set('return', `${request.nextUrl.origin}/auth/gsw`)
      return NextResponse.redirect(login)
    }
  }

  if (isProtected && !user) {
    const login = new URL('/', request.url)
    login.searchParams.set('next', path)
    return NextResponse.redirect(login)
  }

  if (user && path === '/' && !request.nextUrl.searchParams.get('next')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (user && path.startsWith('/auth/gsw')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (gswOnly && user && path === '/' && request.nextUrl.searchParams.get('mode') === 'signup') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth/gsw-bridge|api/admin|api/sync).*)',
  ],
}
