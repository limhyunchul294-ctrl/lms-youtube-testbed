import { NextRequest, NextResponse } from 'next/server'
import { resolveGswBridgeSecret, verifyGswBridgeToken } from '@/lib/gsw-bridge'
import { EVKMC_COURSE_ID_LIST } from '@/lib/evkmc'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const secret = resolveGswBridgeSecret(process.env.GSW_BRIDGE_SECRET)

  let token: string | undefined
  try {
    const body = await req.json()
    token = typeof body?.token === 'string' ? body.token : undefined
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

  const {
    email,
    name,
    gsw_user_id,
    department,
    username,
    phone,
    role,
    grade,
    employee_no,
    employee_id,
    position,
    company,
  } = verified.payload
  const employeeNo = employee_no || employee_id
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
    const { data: profileByEmail } = await admin
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()
    userId = profileByEmail?.id
  }

  if (!userId) {
    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = listData?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail)
    userId = existing?.id
  }

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: {
        full_name: name || '',
        gsw_user_id,
        department: department || null,
        gsw_username: username || null,
        phone: phone || null,
        gsw_role: role || null,
        gsw_grade: grade || null,
        employee_no: employeeNo || null,
        position: position || null,
        company: company || null,
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
      gsw_username: username || null,
      phone: phone || null,
      gsw_role: role || null,
      gsw_grade: grade || null,
      employee_no: employeeNo || null,
      position: position || null,
      company: company || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  // EVKMC 운영 코스 자동 수강 신청 (GSW 최초·재접속 모두 idempotent)
  const enrollRows = EVKMC_COURSE_ID_LIST.map((course_id) => ({
    user_id: userId,
    course_id,
  }))
  await admin.from('enrollments').upsert(enrollRows, { onConflict: 'user_id,course_id' })

  // 기존 사용자 메타데이터도 브릿지 payload 기준으로 동기화
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      full_name: name || normalizedEmail.split('@')[0],
      gsw_user_id,
      department: department || null,
      gsw_username: username || null,
      phone: phone || null,
      gsw_role: role || null,
      gsw_grade: grade || null,
      employee_no: employeeNo || null,
      position: position || null,
      company: company || null,
      source: 'gsw',
    },
  })

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

  const actionLink = linkData.properties.action_link
  if (!actionLink) {
    return NextResponse.json({ error: '세션 액션 링크를 가져오지 못했습니다.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    user_id: userId,
    email: normalizedEmail,
    /** 클라이언트 verifyOtp용 (기존 student1 등 세션 덮어쓰기) */
    token_hash: linkData.properties.hashed_token,
    redirect: actionLink,
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
