import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey)
}

type ProgressSeed = {
  user_email: string
  lesson_id: string
  watched_seconds: number
  is_completed: boolean
}

const SAMPLE_LESSON_IDS = [
  '11111111-aaaa-1111-aaaa-111111111111',
  '11111111-bbbb-1111-bbbb-111111111111',
  '11111111-cccc-1111-cccc-111111111111',
  '22222222-aaaa-2222-aaaa-222222222222',
  '22222222-bbbb-2222-bbbb-222222222222',
  '22222222-cccc-2222-cccc-222222222222',
]

const SAMPLE_USERS = [
  'student1@example.com',
  'student2@example.com',
  'student3@example.com',
]

export async function POST(req: Request) {
  const syncKey = req.headers.get('x-sync-key') || new URL(req.url).searchParams.get('key')
  if (syncKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const samplePassword = process.env.SAMPLE_STUDENT_PASSWORD || 'Sample1234!'

    // 샘플 유저 조회
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    const emailToUserId = new Map<string, string>()
    for (const u of usersData.users) {
      if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id)
    }

    // 없는 샘플 유저는 자동 생성
    const createdUsers: string[] = []
    for (const email of SAMPLE_USERS) {
      if (emailToUserId.has(email.toLowerCase())) continue

      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: samplePassword,
        email_confirm: true,
      })
      if (createError) throw createError
      if (created.user?.id) {
        emailToUserId.set(email.toLowerCase(), created.user.id)
        createdUsers.push(email)
      }
    }

    const targetUsers = SAMPLE_USERS
      .map(email => ({ email, user_id: emailToUserId.get(email.toLowerCase()) }))
      .filter(u => !!u.user_id) as Array<{ email: string; user_id: string }>

    if (!targetUsers.length) {
      return NextResponse.json({
        success: false,
        error: '샘플 계정이 없습니다. student1~3@example.com 계정을 먼저 회원가입해 주세요.',
      }, { status: 400 })
    }

    // 샘플 수강 등록
    const enrollRows = targetUsers.flatMap(u => ([
      { user_id: u.user_id, course_id: '11111111-1111-1111-1111-111111111111' },
      { user_id: u.user_id, course_id: '22222222-2222-2222-2222-222222222222' },
    ]))
    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert(enrollRows, { onConflict: 'user_id,course_id' })
    if (enrollError) throw enrollError

    // 샘플 진도 시나리오
    const scenario: ProgressSeed[] = [
      // student1: 1코스 완료 + 2코스 일부 진행
      { user_email: 'student1@example.com', lesson_id: SAMPLE_LESSON_IDS[0], watched_seconds: 540, is_completed: true },
      { user_email: 'student1@example.com', lesson_id: SAMPLE_LESSON_IDS[1], watched_seconds: 780, is_completed: true },
      { user_email: 'student1@example.com', lesson_id: SAMPLE_LESSON_IDS[2], watched_seconds: 660, is_completed: true },
      { user_email: 'student1@example.com', lesson_id: SAMPLE_LESSON_IDS[3], watched_seconds: 320, is_completed: false },
      // student2: 골고루 반반
      { user_email: 'student2@example.com', lesson_id: SAMPLE_LESSON_IDS[0], watched_seconds: 270, is_completed: false },
      { user_email: 'student2@example.com', lesson_id: SAMPLE_LESSON_IDS[1], watched_seconds: 520, is_completed: false },
      { user_email: 'student2@example.com', lesson_id: SAMPLE_LESSON_IDS[3], watched_seconds: 720, is_completed: true },
      { user_email: 'student2@example.com', lesson_id: SAMPLE_LESSON_IDS[4], watched_seconds: 200, is_completed: false },
      // student3: 거의 미시작
      { user_email: 'student3@example.com', lesson_id: SAMPLE_LESSON_IDS[0], watched_seconds: 60, is_completed: false },
      { user_email: 'student3@example.com', lesson_id: SAMPLE_LESSON_IDS[3], watched_seconds: 40, is_completed: false },
    ]

    const progressRows = scenario
      .map(row => {
        const userId = emailToUserId.get(row.user_email.toLowerCase())
        if (!userId) return null
        return {
          user_id: userId,
          lesson_id: row.lesson_id,
          watched_seconds: row.watched_seconds,
          is_completed: row.is_completed,
          completed_at: row.is_completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }
      })
      .filter(Boolean)

    if (!progressRows.length) {
      return NextResponse.json({ success: false, error: '생성 가능한 샘플 진도 데이터가 없습니다.' }, { status: 400 })
    }

    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert(progressRows, { onConflict: 'user_id,lesson_id' })
    if (progressError) throw progressError

    return NextResponse.json({
      success: true,
      message: '샘플 수강생 진도 생성 완료',
      users: targetUsers.length,
      created_users: createdUsers,
      sample_password: createdUsers.length ? samplePassword : null,
      progress_rows: progressRows.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || '샘플 진도 생성 실패' },
      { status: 500 }
    )
  }
}
