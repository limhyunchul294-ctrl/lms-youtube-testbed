import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { evkmcYoutubeCatalog, buildEvkmcLessonRows } from '@/data/evkmc-youtube-catalog'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey)
}

type SeedBody = {
  /** 1강~7강 순서의 YouTube ID 11자리 배열 */
  youtube_ids?: string[]
}

export async function POST(req: Request) {
  const syncKey = req.headers.get('x-sync-key') || new URL(req.url).searchParams.get('key')
  if (syncKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json().catch(() => ({}))) as SeedBody
    const fromBody = body.youtube_ids?.map((id) => id.trim()).filter(Boolean)
    const fromCatalog = evkmcYoutubeCatalog.lessons.map((l) => l.youtube_id.trim()).filter(Boolean)

    const youtubeIds = fromBody?.length === 7 ? fromBody : fromCatalog

    if (youtubeIds.length !== 7) {
      return NextResponse.json(
        {
          error: 'YouTube ID 7개가 필요합니다 (1강~7강 순).',
          hint: 'content/evkmc-youtube-catalog.json 의 youtube_id 를 채우거나 POST body에 youtube_ids 배열을 보내세요.',
          example: {
            youtube_ids: ['id1강', 'id2강', 'id3강', 'id4강', 'id5강', 'id6강', 'id7강'],
          },
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase 환경변수가 설정되지 않았습니다.' }, { status: 500 })
    }

    const { error: courseError } = await supabase
      .from('courses')
      .upsert(evkmcYoutubeCatalog.courses, { onConflict: 'id' })
    if (courseError) throw courseError

    const lessonRows = buildEvkmcLessonRows(youtubeIds).map((row) => ({
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      lesson_type: row.lesson_type,
      youtube_id: row.youtube_id,
      slides: null,
      duration_seconds: row.duration_seconds,
      sort_order: row.sort_order,
      is_free: row.is_free,
    }))

    const { error: lessonError } = await supabase.from('lessons').upsert(lessonRows, { onConflict: 'id' })
    if (lessonError) throw lessonError

    return NextResponse.json({
      success: true,
      message: 'EVKMC 1~7강 강의·레슨 Supabase 등록 완료',
      courses: evkmcYoutubeCatalog.courses.length,
      lessons: lessonRows.length,
      course_titles: evkmcYoutubeCatalog.courses.map((c) => c.title),
      lesson_map: lessonRows.map((l, i) => ({
        lecture: i + 1,
        title: l.title,
        youtube_id: l.youtube_id,
        duration_seconds: l.duration_seconds,
      })),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'EVKMC 시드 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
