import { NextRequest, NextResponse } from 'next/server'
import { resolveGswBridgeSecret, verifyGswBridgeToken } from '@/lib/gsw-bridge'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const secret = resolveGswBridgeSecret(process.env.GSW_BRIDGE_SECRET)

  let token: string | undefined
  try {
    const body = await req.json()
    token = body.token
  } catch {
    return NextResponse.json({ error: '요청 본문이 올바르지 않습니다.' }, { status: 400 })
  }

  if (!token) {
    return NextResponse.json({ error: 'token이 필요합니다.' }, { status: 400 })
  }

  const verified = verifyGswBridgeToken(token, secret)
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 401 })
  }

  const { email, name, gsw_user_id, department } = verified.payload
  const admin = createServiceSupabase()
  const normalizedEmail = email.trim().toLowerCase()

  // GSW ID 또는 이메일로 기존 사용자 조회
  const { data: profileByGsw } = await admin
    .from('profiles')
    .select('id, email')
    .eq('gsw_user_id', gsw_user_id)
    .maybeSingle()

  let userId = profileByGsw?.id

  if (!userId) {
    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = listData.users.find((u) => u.email?.toLowerCase() === normalizedEmail)
    userId = existing?.id
  }

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: {
        full_name: name || '',
        gsw_user_id,
        source: 'gsw',
      },
    })
    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message || '사용자 생성에 실패했습니다.' },
        { status: 500 }
      )
    }
    userId = created.user.id
  }

  await admin.from('profiles').upsert(
    {
      id: userId,
      email: normalizedEmail,
      display_name: name || normalizedEmail.split('@')[0],
      department: department || null,
      gsw_user_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: normalizedEmail,
    options: {
      redirectTo: `${req.nextUrl.origin}/auth/complete`,
    },
  })

  if (linkError || !linkData.properties?.hashed_token) {
    return NextResponse.json(
      { error: linkError?.message || '세션 링크 생성에 실패했습니다.' },
      { status: 500 }
    )
  }

  const supabase = await createServerSupabase()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: linkData.properties.hashed_token,
  })

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    user_id: userId,
    email: normalizedEmail,
    redirect: '/dashboard',
  })
}

/** 개발용: 데모 토큰 발급 (GSW_BRIDGE_ALLOW_DEV=true 일 때만) */
export async function GET(req: NextRequest) {
  if (
    process.env.GSW_BRIDGE_ALLOW_DEV !== 'true' &&
    process.env.NEXT_PUBLIC_GSW_BRIDGE_ALLOW_DEV !== 'true'
  ) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const secret = resolveGswBridgeSecret(process.env.GSW_BRIDGE_SECRET)

  const email = req.nextUrl.searchParams.get('email') || 'student1@example.com'
  const gswUserId = req.nextUrl.searchParams.get('gsw_user_id') || `gsw-${email.split('@')[0]}`
  const name = req.nextUrl.searchParams.get('name') || '데모 사용자'

  const { createDevGswBridgeToken } = await import('@/lib/gsw-bridge')
  const token = createDevGswBridgeToken(
    { email, name, gsw_user_id: gswUserId, department: 'EVKMC' },
    secret
  )

  return NextResponse.json({
    token,
    bridge_url: `${req.nextUrl.origin}/auth/gsw?token=${encodeURIComponent(token)}`,
  })
}
