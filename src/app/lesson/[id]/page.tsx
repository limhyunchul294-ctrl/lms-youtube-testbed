'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import YouTubePlayer from '@/components/YouTubePlayer'
import SlideLessonPlayer from '@/components/SlideLessonPlayer'
import { parseSlides } from '@/lib/lesson'
import { activityPath, coursePath, lessonPath, publicRef } from '@/lib/routes'
import { resolveLessonId, shouldRedirectToSlug } from '@/lib/resolve-ref'
import type { Lesson, LessonType, UserProgress } from '@/lib/types'

export default function LessonPage() {
  const { id: ref } = useParams<{ id: string }>()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [courseRef, setCourseRef] = useState('')
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [prevNext, setPrevNext] = useState<{ prev: string | null; next: string | null }>({
    prev: null,
    next: null,
  })
  const [completed, setCompleted] = useState(false)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [guideHref, setGuideHref] = useState<string | null>(null)
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

      const resolved = await resolveLessonId(supabase, ref)
      if (!resolved) {
        router.push('/dashboard')
        return
      }

      if (shouldRedirectToSlug(ref, resolved.slug)) {
        router.replace(lessonPath(resolved.slug))
        return
      }

      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', resolved.id)
        .single()

      if (!lessonData) {
        router.push('/dashboard')
        return
      }

      const lessonType = (lessonData.lesson_type || 'video') as LessonType
      const normalized: Lesson = {
        ...lessonData,
        lesson_type: lessonType,
        slides: lessonData.slides ? parseSlides(lessonData.slides) : null,
      }
      setLesson(normalized)

      const { data: course } = await supabase
        .from('courses')
        .select('slug')
        .eq('id', lessonData.course_id)
        .single()
      setCourseRef(course?.slug || lessonData.course_id)

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', lessonData.course_id)
        .maybeSingle()

      if (!enrollment) {
        setAccessError('이 강의는 수강 신청 후 학습할 수 있습니다.')
        setLoading(false)
        return
      }

      try {
        const { data: guideAct } = await supabase
          .from('course_activities')
          .select('id, slug')
          .eq('course_id', lessonData.course_id)
          .eq('activity_type', 'guide')
          .maybeSingle()

        if (guideAct?.id) {
          setGuideHref(activityPath(publicRef({ id: guideAct.id, slug: guideAct.slug })))
          const { data: guideSub } = await supabase
            .from('activity_submissions')
            .select('answers')
            .eq('activity_id', guideAct.id)
            .eq('user_id', user.id)
            .maybeSingle()

          const ack =
            (guideSub?.answers as { acknowledged?: boolean } | null)?.acknowledged === true
          if (!ack) {
            setAccessError('먼저 강의 안내(수강 규정)를 확인해 주세요.')
            setLoading(false)
            return
          }
        }
      } catch (e) {
        console.warn('guide access check failed', e)
      }

      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', resolved.id)
        .maybeSingle()

      setProgress(progressData)
      setCompleted(progressData?.is_completed ?? false)

      const { data: siblings } = await supabase
        .from('lessons')
        .select('id, slug, sort_order')
        .eq('course_id', lessonData.course_id)
        .order('sort_order')

      if (siblings) {
        const idx = siblings.findIndex((s) => s.id === resolved.id)
        const toRef = (row: { id: string; slug: string | null }) =>
          lessonPath(publicRef(row))
        setPrevNext({
          prev: idx > 0 ? toRef(siblings[idx - 1]) : null,
          next: idx < siblings.length - 1 ? toRef(siblings[idx + 1]) : null,
        })
      }

      setLoading(false)
    }
    init()
  }, [ref, router, supabase])

  if (loading) {
    return (
      <AppShell>
        <div className="text-center py-20 text-slate-400 text-sm">불러오는 중...</div>
      </AppShell>
    )
  }

  if (accessError && lesson) {
    return (
      <AppShell title={lesson.title} subtitle={lesson.lesson_type === 'slides' ? '슬라이드' : '영상'}>
        <div className="max-w-3xl mx-auto py-2 text-center px-2">
          <p className="text-sm text-slate-600 mb-4">{accessError}</p>
          {guideHref && (
            <Link
              href={guideHref}
              className="inline-block mr-3 text-sm text-[var(--accent)] font-medium hover:underline touch-manipulation"
            >
              강의 안내로 이동 →
            </Link>
          )}
          <Link
            href={coursePath(courseRef)}
            className="inline-block text-sm text-[var(--accent)] font-medium hover:underline touch-manipulation"
          >
            강의 상세로 이동 →
          </Link>
        </div>
      </AppShell>
    )
  }

  if (!lesson) {
    return (
      <AppShell>
        <div className="text-center py-20 text-slate-400 text-sm">레슨을 찾을 수 없습니다.</div>
      </AppShell>
    )
  }

  const isSlides = lesson.lesson_type === 'slides'
  const slides = lesson.slides || []
  const hubHref = coursePath(courseRef)

  return (
    <AppShell title={lesson.title} subtitle={isSlides ? '슬라이드' : '영상'}>
      <div className="max-w-3xl mx-auto">
        <Link
          href={hubHref}
          className="text-xs text-slate-400 hover:text-slate-600 mb-3 inline-block touch-manipulation"
        >
          ← 강의 목록으로
        </Link>

        <div className="flex items-start gap-2 mb-4">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex-1 leading-snug">
            {lesson.title}
          </h1>
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded border border-slate-200 text-slate-500 bg-slate-50">
            {isSlides ? '슬라이드' : '영상'}
          </span>
        </div>

        {isSlides ? (
          <SlideLessonPlayer
            lessonId={lesson.id}
            slides={slides}
            initialSlideIndex={progress?.last_slide_index ?? 0}
            onComplete={() => setCompleted(true)}
          />
        ) : (
          <YouTubePlayer
            youtubeId={lesson.youtube_id}
            lessonId={lesson.id}
            durationSeconds={lesson.duration_seconds}
            initialWatched={progress?.watched_seconds}
            onComplete={() => setCompleted(true)}
          />
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          {prevNext.prev ? (
            <Link
              href={prevNext.prev}
              className="flex-1 py-3 text-center border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition touch-manipulation min-h-[48px] flex items-center justify-center"
            >
              ← 이전 강의
            </Link>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}

          {prevNext.next ? (
            <Link
              href={prevNext.next}
              className={`flex-1 py-3 text-center rounded-xl text-sm font-medium transition touch-manipulation min-h-[48px] flex items-center justify-center ${
                completed
                  ? 'bg-[var(--accent)] text-white hover:opacity-90'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              다음 강의 →
            </Link>
          ) : (
            <Link
              href={hubHref}
              className="flex-1 py-3 text-center bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition touch-manipulation min-h-[48px] flex items-center justify-center"
            >
              강의 목록으로 ✓
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  )
}
