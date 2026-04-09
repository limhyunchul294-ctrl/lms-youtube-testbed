import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey)
}

type SampleCourse = {
  id: string
  title: string
  description: string
  thumbnail_url: string
  is_published: boolean
  sort_order: number
}

type SampleLesson = {
  id: string
  course_id: string
  title: string
  youtube_id: string
  duration_seconds: number
  sort_order: number
  is_free: boolean
}

const sampleCourses: SampleCourse[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: '전기차 기초 이론',
    description: '전기차 구조, 동력계, 충전 개념을 빠르게 이해하는 입문 과정',
    thumbnail_url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=1280&auto=format&fit=crop',
    is_published: true,
    sort_order: 1,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: '배터리 시스템 실무',
    description: '고전압 배터리 구성, BMS 개념, 안전 점검 포인트를 다룹니다.',
    thumbnail_url: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1280&auto=format&fit=crop',
    is_published: true,
    sort_order: 2,
  },
]

const sampleLessons: SampleLesson[] = [
  {
    id: '11111111-aaaa-1111-aaaa-111111111111',
    course_id: '11111111-1111-1111-1111-111111111111',
    title: '1강. 전기차와 내연기관의 차이',
    youtube_id: 'dQw4w9WgXcQ',
    duration_seconds: 540,
    sort_order: 1,
    is_free: true,
  },
  {
    id: '11111111-bbbb-1111-bbbb-111111111111',
    course_id: '11111111-1111-1111-1111-111111111111',
    title: '2강. 구동 모터 기본 구조',
    youtube_id: 'aqz-KE-bpKQ',
    duration_seconds: 780,
    sort_order: 2,
    is_free: true,
  },
  {
    id: '11111111-cccc-1111-cccc-111111111111',
    course_id: '11111111-1111-1111-1111-111111111111',
    title: '3강. 충전 방식과 전력 이해',
    youtube_id: 'M7lc1UVf-VE',
    duration_seconds: 660,
    sort_order: 3,
    is_free: true,
  },
  {
    id: '22222222-aaaa-2222-aaaa-222222222222',
    course_id: '22222222-2222-2222-2222-222222222222',
    title: '1강. 배터리 셀/모듈/팩 구조',
    youtube_id: 'ysz5S6PUM-U',
    duration_seconds: 720,
    sort_order: 1,
    is_free: true,
  },
  {
    id: '22222222-bbbb-2222-bbbb-222222222222',
    course_id: '22222222-2222-2222-2222-222222222222',
    title: '2강. BMS 핵심 파라미터',
    youtube_id: 'ScMzIvxBSi4',
    duration_seconds: 840,
    sort_order: 2,
    is_free: true,
  },
  {
    id: '22222222-cccc-2222-cccc-222222222222',
    course_id: '22222222-2222-2222-2222-222222222222',
    title: '3강. 고전압 안전 점검 체크리스트',
    youtube_id: 'LXb3EKWsInQ',
    duration_seconds: 690,
    sort_order: 3,
    is_free: true,
  },
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

    const { error: courseError } = await supabase
      .from('courses')
      .upsert(sampleCourses, { onConflict: 'id' })
    if (courseError) throw courseError

    const { error: lessonError } = await supabase
      .from('lessons')
      .upsert(sampleLessons, { onConflict: 'id' })
    if (lessonError) throw lessonError

    return NextResponse.json({
      success: true,
      message: '샘플 강의/레슨 데이터 생성 완료',
      courses: sampleCourses.length,
      lessons: sampleLessons.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || '샘플 데이터 생성 실패' },
      { status: 500 }
    )
  }
}
