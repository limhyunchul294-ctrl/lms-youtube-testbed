import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { buildEvkmcActivityRows } from '@/data/evkmc-activities'
import { requireAdminAccess } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const auth = await requireAdminAccess()
  if (!auth.ok) return auth.response

  try {
    const supabase = createServiceSupabase()
    const rows = buildEvkmcActivityRows()

    const { error } = await supabase.from('course_activities').upsert(rows, { onConflict: 'id' })
    if (error) throw error

    return NextResponse.json({
      ok: true,
      activities: rows.length,
      courses: 2,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
