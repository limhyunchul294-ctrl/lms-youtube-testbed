import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 set 불가할 수 있음 — Route Handler에서는 동작
          }
        },
      },
    }
  )
}

export function createServiceSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Route Handler — verifyOtp 등으로 Set-Cookie를 응답에 실어 보낼 때 사용 */
export function createRouteHandlerSupabase(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

/**
 * generateLink(magiclink) hashed_token → Supabase 세션 쿠키
 * magiclink / email 타입 순으로 시도 (Supabase 버전별 차이)
 */
export async function establishSessionFromTokenHash(
  request: NextRequest,
  tokenHash: string,
  body: Record<string, unknown>
): Promise<NextResponse> {
  const otpTypes = ['magiclink', 'email'] as const

  for (const otpType of otpTypes) {
    const response = NextResponse.json(body)
    const supabase = createRouteHandlerSupabase(request, response)
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    })
    if (!error) {
      return response
    }
    console.warn(`GSW bridge verifyOtp(${otpType}) failed:`, error.message)
  }

  return NextResponse.json(
    { error: '세션 연동에 실패했습니다. GSW 포털에서 «교육 센터»를 다시 선택해 주세요.' },
    { status: 500 }
  )
}
