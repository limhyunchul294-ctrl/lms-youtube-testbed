import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { buildEvkmcActivityRows } from '@/data/evkmc-activities'

function checkKey(req: NextRequest) {
  const key = req.headers.get('x-sync-key') || req.nextUrl.searchParams.get('key')
  return key && key === process.env.SYNC_API_KEY
}

export async function POST(req: NextRequest) {
  if (!checkKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
