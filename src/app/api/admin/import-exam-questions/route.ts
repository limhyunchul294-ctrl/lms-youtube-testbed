import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import {
  EVKMC_COURSE_IDS,
  EVKMC_EXAM_ACTIVITY_IDS,
  isEvkmcCourseId,
} from '@/lib/evkmc'
import { getEcoExamQuestions, getHvExamQuestions } from '@/data/evkmc-exam-banks'

function checkKey(req: NextRequest) {
  const key = req.headers.get('x-sync-key') || req.nextUrl.searchParams.get('key')
  return key && key === process.env.SYNC_API_KEY
}

type ExamQuestion = {
  id: string
  label: string
  options: string[]
  correct: number
}

export async function POST(req: NextRequest) {
  if (!checkKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let body: {
      course_id?: string
      pass_score?: number
      questions?: ExamQuestion[]
      use_bank?: boolean
      question_count?: number
    } = {}

    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const courseId = body.course_id
    if (!courseId || !isEvkmcCourseId(courseId)) {
      return NextResponse.json(
        { error: 'course_id는 EVKMC 코스 UUID(친환경차/고전압)여야 합니다.' },
        { status: 400 }
      )
    }

    const defaultCount = courseId === EVKMC_COURSE_IDS.eco ? 30 : 60
    const count = body.question_count ?? defaultCount
    const passScore = body.pass_score ?? 70

    let questions: ExamQuestion[] = body.questions || []
    if ((!questions.length || body.use_bank) && !body.questions?.length) {
      questions =
        courseId === EVKMC_COURSE_IDS.eco
          ? getEcoExamQuestions(count)
          : getHvExamQuestions(count)
    }

    if (!questions.length) {
      return NextResponse.json({ error: 'questions가 비어 있습니다.' }, { status: 400 })
    }

    const activityId =
      courseId === EVKMC_COURSE_IDS.eco
        ? EVKMC_EXAM_ACTIVITY_IDS.eco
        : EVKMC_EXAM_ACTIVITY_IDS.hv

    const supabase = createServiceSupabase()
    const { data: existing } = await supabase
      .from('course_activities')
      .select('config, title')
      .eq('id', activityId)
      .maybeSingle()

    const config = {
      ...(typeof existing?.config === 'object' && existing.config ? existing.config : {}),
      pass_score: passScore,
      questions,
    }

    const { error } = await supabase
      .from('course_activities')
      .update({ config })
      .eq('id', activityId)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      course_id: courseId,
      activity_id: activityId,
      question_count: questions.length,
      pass_score: passScore,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
