'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import CourseLearningPath from '@/components/course/CourseLearningPath'
import LessonCatalogMeta from '@/components/course/LessonCatalogMeta'
import NextActionBanner from '@/components/course/NextActionBanner'
import {
  buildCompletedActivityIds,
  buildLearningSteps,
  computeLessonProgressPercent,
  resolveNextStep,
  stepToNextAction,
} from '@/lib/lms'
import { getCatalogModules } from '@/lib/lms/catalog'
import { coursePath, lessonPath, activityPath, publicRef } from '@/lib/routes'
import { slideProgressPercent, videoWatchPercent } from '@/lib/lesson'
import { resolveCourseId, shouldRedirectToSlug } from '@/lib/resolve-ref'
import type {
  Course,
  CourseActivity,
  CourseLearningStatus,
  LessonWithProgress,
} from '@/lib/types'

export default function CourseDetailPage() {
  const { id: ref } = useParams<{ id: string }>()
  const [courseId, setCourseId] = useState<string | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [lessonSlugById, setLessonSlugById] = useState<Record<string, string | null>>({})
  const [lessons, setLessons] = useState<LessonWithProgress[]>([])
  const [activities, setActivities] = useState<CourseActivity[]>([])
  const [submissions, setSubmissions] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<CourseLearningStatus | null>(null)
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const courseRef = course ? publicRef(course) : ref

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const resolved = await resolveCourseId(supabase, ref)
      if (!resolved) {
        router.push('/dashboard')
        return
      }

      if (shouldRedirectToSlug(ref, resolved.slug)) {
        router.replace(coursePath(resolved.slug))
        return
      }

      setCourseId(resolved.id)

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', resolved.id)
        .maybeSingle()
      setEnrolled(!!enrollment)

      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', resolved.id)
        .single()
      setCourse(courseData)

      const { data: slugRows } = await supabase
        .from('lessons')
        .select('id, slug')
        .eq('course_id', resolved.id)
      const slugMap: Record<string, string | null> = {}
      ;(slugRows || []).forEach((r) => {
        slugMap[r.id] = r.slug
      })
      setLessonSlugById(slugMap)

      const { data: lessonsData } = await supabase.rpc('get_my_course_progress', {
        p_course_id: resolved.id,
      })
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
        .eq('course_id', resolved.id)
        .order('sort_order')
      setActivities((acts || []) as CourseActivity[])

      const { data: subs } = await supabase
        .from('activity_submissions')
        .select('activity_id, passed, answers')
        .eq('user_id', user.id)

      setSubmissions(
        buildCompletedActivityIds(
          (acts || []) as CourseActivity[],
          (subs || []) as { activity_id: string; passed?: boolean | null; answers?: Record<string, unknown> }[]
        )
      )

      const { data: st } = await supabase.rpc('get_course_learning_status', {
        p_course_id: resolved.id,
      })
      if (st?.[0]) setStatus(st[0] as CourseLearningStatus)

      setLoading(false)
    }
    init()
  }, [ref, router, supabase])

  const completedCount = lessons.filter((l) => l.is_completed).length
  const totalCount = lessons.length
  const overallPct =
    status?.course_complete
      ? 100
      : computeLessonProgressPercent(completedCount, totalCount)

  const catalogModules = courseId ? getCatalogModules(courseId) : []

  const learningSteps = useMemo(
    () =>
      buildLearningSteps({
        enrolled,
        activities,
        completedActivityIds: submissions,
        lessons: lessons.map((l) => ({
          lesson_id: l.lesson_id,
          is_completed: l.is_completed,
          sort_order: l.sort_order,
        })),
        lessonHref: (lessonId) =>
          lessonPath(publicRef({ id: lessonId, slug: lessonSlugById[lessonId] })),
        activityHref: (act) => activityPath(publicRef(act)),
        status,
      }),
    [activities, submissions, lessons, enrolled, lessonSlugById, status]
  )

  const formatDuration = (s: number) => {
    if (s <= 0) return ''
    const m = Math.floor(s / 60)
    return `${m}분`
  }

  if (loading || !courseId) {
    return (
      <AppShell>
        <div className="text-center py-20 text-sm text-[var(--text-muted)]">불러오는 중…</div>
      </AppShell>
    )
  }

  const guideAct = activities.find((a) => a.activity_type === 'guide')
  const nextStep = resolveNextStep(learningSteps)
  const nextAction = nextStep ? stepToNextAction(nextStep) : null

  return (
    <AppShell title={course?.title || '강의'} subtitle={course?.description || undefined}>
      <Link
        href="/dashboard"
        className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] mb-4 inline-block touch-manipulation"
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
            href={coursePath(courseRef, 'certificate')}
            className="mt-2 inline-block text-sm font-semibold text-green-800 underline touch-manipulation"
          >
            수료증 보기 · 인쇄 →
          </Link>
        </div>
      )}
      {!status?.course_complete && nextAction && (
        <NextActionBanner
          title={nextAction.title}
          detail={nextAction.detail}
          href={nextAction.href}
          ctaLabel={nextAction.ctaLabel}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-5 mb-8">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-5">
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
      <div className="space-y-4">
        {(catalogModules.length > 0
          ? catalogModules.map((mod) => ({
              title: mod.title,
              description: mod.description,
              lessons: lessons
                .filter((l) => mod.lesson_ids.includes(l.lesson_id))
                .sort((a, b) => a.sort_order - b.sort_order),
            }))
          : [{ title: null, description: null, lessons: [...lessons].sort((a, b) => a.sort_order - b.sort_order) }]
        ).map((group, gi) => (
          <div key={group.title ?? `group-${gi}`}>
            {group.title && (
              <div className="mb-2 px-1">
                <p className="text-xs font-semibold text-[var(--text)]">{group.title}</p>
                {group.description && (
                  <p className="text-[10px] text-[var(--text-muted)]">{group.description}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              {group.lessons.map((lesson, idx) => {
          const locked =
            !enrolled ||
            (guideAct && !submissions.has(guideAct.id))

          const lessonRef = publicRef({
            id: lesson.lesson_id,
            slug: lessonSlugById[lesson.lesson_id],
          })

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
                <LessonCatalogMeta lessonId={lesson.lesson_id} />
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] uppercase text-[var(--text-muted)]">
                    {lesson.lesson_type === 'slides' ? '슬라이드' : '영상'}
                  </span>
                  {lesson.duration_seconds > 0 && lesson.lesson_type !== 'slides' && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatDuration(lesson.duration_seconds)}
                    </span>
                  )}
                </div>
                {!locked && !lesson.is_completed && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 progress-bar h-1.5 max-w-[140px]">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${
                            lesson.lesson_type === 'slides'
                              ? slideProgressPercent(
                                  lesson.last_slide_index,
                                  lesson.slide_count || 1
                                )
                              : videoWatchPercent(
                                  lesson.watched_seconds,
                                  lesson.duration_seconds
                                )
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--accent)] tabular-nums shrink-0">
                      {lesson.lesson_type === 'slides'
                        ? slideProgressPercent(lesson.last_slide_index, lesson.slide_count || 1)
                        : videoWatchPercent(lesson.watched_seconds, lesson.duration_seconds)}
                      %
                    </span>
                  </div>
                )}
              </div>
              {!locked && <span className="text-slate-300 self-center">›</span>}
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
              href={lessonPath(lessonRef)}
              className="card-hover flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 block touch-manipulation min-h-[56px]"
            >
              {inner}
            </Link>
          )
              })}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
