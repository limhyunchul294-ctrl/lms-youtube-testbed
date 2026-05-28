import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { estimateSlideLessonDuration } from '@/lib/lesson'
import type { SlideItem } from '@/lib/types'
import { requireAdminAccess } from '@/lib/admin-auth'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey)
}

type UpsertBody = {
  id?: string
  course_id: string
  title: string
  slides: SlideItem[]
  sort_order?: number
  is_free?: boolean
}

export async function POST(req: Request) {
  const auth = await requireAdminAccess()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json()) as UpsertBody
    if (!body.course_id || !body.title || !Array.isArray(body.slides) || body.slides.length === 0) {
      return NextResponse.json(
        { error: 'course_id, title, slides(1장 이상)가 필요합니다.' },
        { status: 400 }
      )
    }

    const slides = body.slides.filter(s => s?.image_url?.trim())
    if (!slides.length) {
      return NextResponse.json({ error: '유효한 image_url이 있는 슬라이드가 없습니다.' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const row = {
      id: body.id,
      course_id: body.course_id,
      title: body.title,
      lesson_type: 'slides' as const,
      youtube_id: '',
      slides,
      duration_seconds: estimateSlideLessonDuration(slides.length),
      sort_order: body.sort_order ?? 99,
      is_free: body.is_free ?? false,
    }

    const { data, error } = await supabase
      .from('lessons')
      .upsert(row, { onConflict: 'id' })
      .select('id, title, lesson_type, sort_order')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: '슬라이드 레슨 저장 완료',
      lesson: data,
      slide_count: slides.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '슬라이드 레슨 저장 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
