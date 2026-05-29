import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { requireAdminAccess } from '@/lib/admin-auth'
import { validateActivityConfig } from '@/lib/activity-config'
import type { ActivityType } from '@/lib/types'

export async function POST(req: NextRequest) {
  const auth = await requireAdminAccess()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const {
      id,
      course_id,
      activity_type,
      title,
      description,
      config,
      sort_order,
      is_required,
    } = body

    if (!id || !course_id || !activity_type || !title) {
      return NextResponse.json(
        { error: 'id, course_id, activity_type, title은 필수입니다.' },
        { status: 400 }
      )
    }

    if (!['guide', 'evaluation', 'exam'].includes(activity_type)) {
      return NextResponse.json({ error: 'activity_type이 올바르지 않습니다.' }, { status: 400 })
    }

    let normalizedConfig: Record<string, unknown>
    try {
      normalizedConfig = validateActivityConfig(activity_type as ActivityType, config ?? {})
    } catch (e) {
      const message = e instanceof Error ? e.message : 'config 형식이 올바르지 않습니다.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const supabase = createServiceSupabase()
    const row = {
      id,
      course_id,
      activity_type,
      title,
      description: description ?? null,
      config: normalizedConfig,
      sort_order: sort_order ?? 0,
      is_required: is_required ?? true,
    }

    const { data, error } = await supabase
      .from('course_activities')
      .upsert(row, { onConflict: 'id' })
      .select('id, course_id, activity_type, title')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, activity: data })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
