import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 서버사이드 Supabase 클라이언트 (service_role key로 RLS 우회)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const AIRTABLE_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN!
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!

// ── Airtable API 헬퍼 ──
async function airtableFetch(tableName: string, method: string, body?: any) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Airtable ${method} ${tableName}: ${res.status} - ${err}`)
  }
  return res.json()
}

// 기존 Airtable 레코드 조회 (모든 페이지)
async function getAirtableRecords(tableName: string) {
  const records: any[] = []
  let offset: string | undefined

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`)
    if (offset) url.searchParams.set('offset', offset)

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` },
    })
    const data = await res.json()
    records.push(...(data.records || []))
    offset = data.offset
  } while (offset)

  return records
}

// Airtable 배치 upsert (10건씩)
async function batchUpsert(tableName: string, records: any[], mergeField: string) {
  const results: any[] = []
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10)
    // Rate limit: 5 req/sec → 200ms 딜레이
    if (i > 0) await new Promise(r => setTimeout(r, 250))

    const res = await airtableFetch(tableName, 'PATCH', {
      performUpsert: { fieldsToMergeOn: [mergeField] },
      records: batch.map(r => ({ fields: r })),
    })
    results.push(...(res.records || []))
  }
  return results
}

// ══════════════════════════════════════
// POST /api/sync/airtable
// 인증: x-sync-key 헤더 또는 쿼리 파라미터
// ══════════════════════════════════════
export async function POST(req: Request) {
  // API 키 인증:
  // - 수동 호출: x-sync-key 헤더 또는 ?key=
  // - Vercel Cron: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  const syncKey = req.headers.get('x-sync-key') || new URL(req.url).searchParams.get('key') || bearerToken
  const allowedKeys = [process.env.SYNC_API_KEY, process.env.CRON_SECRET].filter(Boolean)

  if (!syncKey || !allowedKeys.includes(syncKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const logs: string[] = []

    // ── 1. 강의 목록 동기화 ──
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')

    if (courses?.length) {
      const courseRecords = courses.map(c => ({
        'course_id': c.id,
        'title': c.title,
        'description': c.description || '',
        'is_published': c.is_published,
        'sort_order': c.sort_order,
      }))
      await batchUpsert('courses', courseRecords, 'course_id')
      logs.push(`courses: ${courseRecords.length}건 동기화`)
    }

    // ── 2. 레슨 목록 동기화 ──
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*, courses(title)')
      .order('sort_order')

    if (lessons?.length) {
      const lessonRecords = lessons.map(l => ({
        'lesson_id': l.id,
        'course_name': (l as any).courses?.title || '',
        'title': l.title,
        'youtube_id': l.youtube_id,
        'duration_min': Math.round(l.duration_seconds / 60),
        'sort_order': l.sort_order,
      }))
      await batchUpsert('lessons', lessonRecords, 'lesson_id')
      logs.push(`lessons: ${lessonRecords.length}건 동기화`)
    }

    // ── 3. 수강생별 진도 현황 동기화 ──
    const { data: progressData } = await supabase.rpc('get_all_progress')

    if (progressData?.length) {
      const progressRecords = progressData.map((p: any) => ({
        'sync_key': `${p.user_email}__${p.course_title}`,
        'email': p.user_email,
        'course': p.course_title,
        'completed': p.completed_lessons,
        'total': p.total_lessons,
        // Airtable percent 타입은 0~1 값을 기대 (0.75 => 75%)
        'progress_pct': (p.progress_pct || 0) / 100,
        'status': (p.progress_pct || 0) === 100 ? '수료완료'
                : (p.progress_pct || 0) > 0 ? '학습중'
                : '미시작',
        'synced_at': new Date().toISOString(),
      }))
      await batchUpsert('progress', progressRecords, 'sync_key')
      logs.push(`progress: ${progressRecords.length}건 동기화`)
    }

    // ── 4. 수강생 요약 동기화 ──
    if (progressData?.length) {
      const emailMap = new Map<string, { total: number; completed: number; courses: number }>()
      for (const p of progressData) {
        const prev = emailMap.get(p.user_email) || { total: 0, completed: 0, courses: 0 }
        emailMap.set(p.user_email, {
          total: prev.total + (p.total_lessons || 0),
          completed: prev.completed + (p.completed_lessons || 0),
          courses: prev.courses + 1,
        })
      }

      const studentRecords = Array.from(emailMap.entries()).map(([email, stats]) => ({
        'email': email,
        'enrolled_courses': stats.courses,
        'total_lessons': stats.total,
        'completed_lessons': stats.completed,
        // Airtable percent 타입은 0~1 값을 기대 (0.75 => 75%)
        'overall_pct': (stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0) / 100,
        'status': stats.total > 0 && stats.completed === stats.total ? '전과정수료'
                : stats.completed > 0 ? '학습중'
                : '미시작',
        'synced_at': new Date().toISOString(),
      }))
      await batchUpsert('students', studentRecords, 'email')
      logs.push(`students: ${studentRecords.length}건 동기화`)
    }

    return NextResponse.json({
      success: true,
      synced_at: new Date().toISOString(),
      logs,
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}

// GET: 동기화 상태 확인용
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  const syncKey = new URL(req.url).searchParams.get('key') || bearerToken
  const allowedKeys = [process.env.SYNC_API_KEY, process.env.CRON_SECRET].filter(Boolean)

  if (!syncKey || !allowedKeys.includes(syncKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: 'ready',
    endpoints: {
      sync: 'POST /api/sync/airtable (x-sync-key header)',
    },
    airtable_configured: !!AIRTABLE_TOKEN && !!AIRTABLE_BASE_ID,
  })
}
