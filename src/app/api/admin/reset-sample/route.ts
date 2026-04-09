import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey)
}

const SAMPLE_COURSE_IDS = [
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
]

const SAMPLE_LESSON_IDS = [
  '11111111-aaaa-1111-aaaa-111111111111',
  '11111111-bbbb-1111-bbbb-111111111111',
  '11111111-cccc-1111-cccc-111111111111',
  '22222222-aaaa-2222-aaaa-222222222222',
  '22222222-bbbb-2222-bbbb-222222222222',
  '22222222-cccc-2222-cccc-222222222222',
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

    // FK 순서: progress -> enrollments -> lessons -> courses
    const { error: progressError } = await supabase
      .from('user_progress')
      .delete()
      .in('lesson_id', SAMPLE_LESSON_IDS)
    if (progressError) throw progressError

    const { error: enrollError } = await supabase
      .from('enrollments')
      .delete()
      .in('course_id', SAMPLE_COURSE_IDS)
    if (enrollError) throw enrollError

    const { error: lessonError } = await supabase
      .from('lessons')
      .delete()
      .in('id', SAMPLE_LESSON_IDS)
    if (lessonError) throw lessonError

    const { error: courseError } = await supabase
      .from('courses')
      .delete()
      .in('id', SAMPLE_COURSE_IDS)
    if (courseError) throw courseError

    return NextResponse.json({
      success: true,
      message: '샘플 데이터 초기화 완료',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || '샘플 데이터 초기화 실패' },
      { status: 500 }
    )
  }
}
