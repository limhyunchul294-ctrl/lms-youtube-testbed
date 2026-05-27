'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import CourseLearningPath, { type LearningStep } from '@/components/course/CourseLearningPath'
import type {
  Course,
  CourseActivity,
  CourseLearningStatus,
  LessonWithProgress,
} from '@/lib/types'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<LessonWithProgress[]>([])
  const [activities, setActivities] = useState<CourseActivity[]>([])
  const [submissions, setSubmissions] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<CourseLearningStatus | null>(null)
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', id)
        .maybeSingle()
      setEnrolled(!!enrollment)

      const { data: courseData } = await supabase.from('courses').select('*').eq('id', id).single()
      setCourse(courseData)

      const { data: lessonsData } = await supabase.rpc('get_my_course_progress', { p_course_id: id })
      setLessons(
        (lessonsData || []).map((l: LessonWithProgress) => ({
          ...l,
          lesson_type: l.lesson_type || 'video',
          slide_count: l.slide_count ?? 0,
          last_slide_index: l.last_slide_index ?? 0,
        }))
      )

      const { data: acts } = await supabase
        .from('course_activities')
        .select('*')
        .eq('course_id', id)
        .order('sort_order')
      setActivities((acts || []) as CourseActivity[])

      const { data: subs } = await supabase
        .from('activity_submissions')
        .select('activity_id, passed, answers')
        .eq('user_id', user.id)

      const done = new Set<string>()
      ;(subs || []).forEach((s) => {
        const act = (acts || []).find((a: CourseActivity) => a.id === s.activity_id)
        if (!act) return
        if (act.activity_type === 'guide' && (s.answers as { acknowledged?: boolean })?.acknowledged) {
          done.add(s.activity_id)
        }
        if ((act.activity_type === 'evaluation' || act.activity_type === 'exam') && s.passed) {
          done.add(s.activity_id)
        }
      })
      setSubmissions(done)

      const { data: st } = await supabase.rpc('get_course_learning_status', { p_course_id: id })
      if (st?.[0]) setStatus(st[0] as CourseLearningStatus)

      setLoading(false)
    }
    init()
  }, [id, router, supabase])

  const completedCount = lessons.filter((l) => l.is_completed).length
  const totalCount = lessons.length
  const overallPct =
    status?.course_complete
      ? 100
      : totalCount > 0
        ? Math.round((completedCount / totalCount) * 100)
        : 0

  const learningSteps: LearningStep[] = useMemo(() => {
    const guide = activities.find((a) => a.activity_type === 'guide')
    const evaluation = activities.find((a) => a.activity_type === 'evaluation')
    const exam = activities.find((a) => a.activity_type === 'exam')

    const guideDone = guide ? submissions.has(guide.id) : true
    const lessonsDone = totalCount > 0 && completedCount >= totalCount
    const evalDone = evaluation ? submissions.has(evaluation.id) : true
    const examDone = exam ? submissions.has(exam.id) : true

    const firstLesson = lessons[0]

    return [
      {
        key: 'guide',
        label: '강의 안내 · 수강 규정',
        href: guide ? `/activity/${guide.id}` : '#',
        status: !guide
          ? 'done'
          : guideDone
            ? 'done'
            : enrolled
              ? 'available'
              : 'locked',
        detail: guideDone ? '확인 완료' : '수강 전 필독',
      },
      {
        key: 'lessons',
        label: '영상 수강',
        href: firstLesson ? `/lesson/${firstLesson.lesson_id}` : '#',
        status: !enrolled
          ? 'locked'
          : lessonsDone
            ? 'done'
            : guideDone || !guide
              ? completedCount > 0
                ? 'in_progress'
                : 'available'
              : 'locked',
        detail: `${completedCount}/${totalCount} 강 완료`,
      },
      {
        key: 'evaluation',
        label: '강의 만족도 평가',
        href: evaluation ? `/activity/${evaluation.id}` : '#',
        status: !evaluation
          ? 'done'
          : evalDone
            ? 'done'
            : lessonsDone
              ? 'available'
              : 'locked',
        detail: evalDone ? '제출 완료' : '전 강의 수강 후 진행',
      },
      {
        key: 'exam',
        label: '온라인 시험',
        href: exam ? `/activity/${exam.id}` : '#',
        status: !exam
          ? 'done'
          : examDone
            ? 'done'
            : evalDone || !evaluation
              ? lessonsDone
                ? 'available'
                : 'locked'
              : 'locked',
        detail: examDone ? '합격' : `합격 기준 ${Number(exam?.config?.pass_score ?? 70)}점`,
      },
    ]
  }, [activities, submissions, lessons, enrolled, completedCount, totalCount])

  const formatDuration = (s: number) => {
    if (s <= 0) return ''
    const m = Math.floor(s / 60)
    return `${m}분`
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-center py-20 text-sm text-[var(--text-muted)]">불러오는 중…</div>
      </AppShell>
    )
  }

  return (
    <AppShell title={course?.title || '강의'} subtitle={course?.description || undefined}>
      <Link
        href="/dashboard"
        className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] mb-4 inline-block"
      >
        ← 내 학습
      </Link>

      {!enrolled && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          수강 신청 후 학습을 시작할 수 있습니다.{' '}
          <Link href="/courses" className="font-medium underline">
            강의 탐색
          </Link>
        </div>
      )}

      {status?.course_complete && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium">🎉 이 강의의 필수 학습(수강·평가·시험)을 모두 완료했습니다.</p>
          <Link
            href={`/course/${id}/certificate`}
            className="mt-2 inline-block text-sm font-semibold text-green-800 underline"
          >
            수료증 보기 · 인쇄 →
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5 mb-8">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            전체 진행
          </p>
          <p className="text-3xl font-bold text-[var(--text)] mt-1">{overallPct}%</p>
          <div className="progress-bar mt-3" style={{ height: 8 }}>
            <div
              className={`progress-bar-fill ${status?.course_complete ? 'complete' : ''}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            영상 {completedCount}/{totalCount}
            {status &&
              ` · 활동 ${status.completed_required_activities}/${status.total_required_activities}`}
          </p>
        </div>
        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">학습 로드맵</h2>
          <CourseLearningPath steps={learningSteps} />
        </div>
      </div>

      <h2 className="text-sm font-semibold text-[var(--text)] mb-3">강의 목차</h2>
      <div className="space-y-2">
        {lessons.map((lesson, idx) => {
          const locked = !enrolled || (activities.some((a) => a.activity_type === 'guide') &&
            !submissions.has(activities.find((a) => a.activity_type === 'guide')!.id))

          const inner = (
            <>
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  lesson.is_completed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {lesson.is_completed ? '✓' : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-sm font-medium ${
                    lesson.is_completed ? 'text-slate-400 line-through' : 'text-[var(--text)]'
                  }`}
                >
                  {lesson.lesson_title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] uppercase text-[var(--text-muted)]">
                    {lesson.lesson_type === 'slides' ? '슬라이드' : '영상'}
                  </span>
                  {lesson.duration_seconds > 0 && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatDuration(lesson.duration_seconds)}
                    </span>
                  )}
                </div>
              </div>
              {!locked && <span className="text-slate-300">›</span>}
            </>
          )

          if (locked) {
            return (
              <div
                key={lesson.lesson_id}
                className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 opacity-70"
              >
                {inner}
              </div>
            )
          }

          return (
            <Link
              key={lesson.lesson_id}
              href={`/lesson/${lesson.lesson_id}`}
              className="card-hover flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 block"
            >
              {inner}
            </Link>
          )
        })}
      </div>
    </AppShell>
  )
}
