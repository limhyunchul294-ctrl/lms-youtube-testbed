'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import YouTubePlayer from '@/components/YouTubePlayer'
import SlideLessonPlayer from '@/components/SlideLessonPlayer'
import { parseSlides } from '@/lib/lesson'
import type { Lesson, LessonType, UserProgress } from '@/lib/types'

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [prevNext, setPrevNext] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null })
  const [completed, setCompleted] = useState(false)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [guideActivityId, setGuideActivityId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single()

      if (!lessonData) { router.push('/dashboard'); return }

      const lessonType = (lessonData.lesson_type || 'video') as LessonType
      const normalized: Lesson = {
        ...lessonData,
        lesson_type: lessonType,
        slides: lessonData.slides ? parseSlides(lessonData.slides) : null,
      }
      setLesson(normalized)

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

      // 학습 흐름 강제: 먼저 "강의 안내(guide)"를 확인해야 영상/슬라이드 레슨을 볼 수 있습니다.
      try {
        const { data: guideAct } = await supabase
          .from('course_activities')
          .select('id')
          .eq('course_id', lessonData.course_id)
          .eq('activity_type', 'guide')
          .maybeSingle()

        if (guideAct?.id) {
          setGuideActivityId(guideAct.id)
          const { data: guideSub } = await supabase
            .from('activity_submissions')
            .select('answers')
            .eq('activity_id', guideAct.id)
            .eq('user_id', user.id)
            .maybeSingle()

          const ack = (guideSub?.answers as { acknowledged?: boolean } | null)?.acknowledged === true
          if (!ack) {
            setAccessError('먼저 강의 안내(수강 규정)를 확인해 주세요.')
            setLoading(false)
            return
          }
        }
      } catch (e) {
        // 마이그레이션이 아직 적용되지 않은 상태에서는 테이블 조회가 실패할 수 있습니다.
        // 이 경우 UX 테스트를 위해 기존 enrolment만으로 레슨 접근을 허용합니다.
        console.warn('guide access check failed', e)
      }

      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', id)
        .maybeSingle()

      setProgress(progressData)
      setCompleted(progressData?.is_completed ?? false)

      const { data: siblings } = await supabase
        .from('lessons')
        .select('id, sort_order')
        .eq('course_id', lessonData.course_id)
        .order('sort_order')

      if (siblings) {
        const idx = siblings.findIndex(s => s.id === id)
        setPrevNext({
          prev: idx > 0 ? siblings[idx - 1].id : null,
          next: idx < siblings.length - 1 ? siblings[idx + 1].id : null,
        })
      }

      setLoading(false)
    }
    init()
  }, [id, router, supabase])

  if (loading) {
    return (
      <>
        <AppShell>
          <div className="text-center py-20 text-slate-400 text-sm">불러오는 중...</div>
        </AppShell>
      </>
    )
  }

  if (accessError && lesson) {
    return (
      <>
        <AppShell title={lesson.title} subtitle={lesson.lesson_type === 'slides' ? '슬라이드' : '영상'}>
          <div className="max-w-3xl mx-auto px-1 md:px-0 py-2 text-center">
            <p className="text-sm text-slate-600 mb-4">{accessError}</p>

            {guideActivityId ? (
              <Link
                href={`/activity/${guideActivityId}`}
                className="inline-block mr-3 text-sm text-[var(--accent)] font-medium hover:underline"
              >
                강의 안내로 이동 →
              </Link>
            ) : null}

            <Link
              href={`/course/${lesson.course_id}`}
              className="inline-block text-sm text-blue-600 font-medium hover:underline"
            >
              강의 상세로 이동 →
            </Link>
          </div>
        </AppShell>
      </>
    )
  }

  if (!lesson) {
    return (
      <>
        <AppShell>
          <div className="text-center py-20 text-slate-400 text-sm">레슨을 찾을 수 없습니다.</div>
        </AppShell>
      </>
    )
  }

  const isSlides = lesson.lesson_type === 'slides'
  const slides = lesson.slides || []

  return (
    <AppShell title={lesson.title} subtitle={isSlides ? '슬라이드' : '영상'}>
      <div className="max-w-3xl mx-auto px-1 md:px-0">
        <Link
          href={`/course/${lesson.course_id}`}
          className="text-xs text-slate-400 hover:text-slate-600 mb-3 inline-block"
        >
          ← 강의 목록으로
        </Link>

        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-lg font-bold text-slate-900 flex-1">{lesson.title}</h1>
          <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded border border-slate-200 text-slate-500 bg-slate-50">
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

        <div className="mt-6 flex gap-3">
          {prevNext.prev ? (
            <Link
              href={`/lesson/${prevNext.prev}`}
              className="flex-1 py-2.5 text-center border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              ← 이전 강의
            </Link>
          ) : <div className="flex-1" />}

          {prevNext.next ? (
            <Link
              href={`/lesson/${prevNext.next}`}
              className={`flex-1 py-2.5 text-center rounded-lg text-sm font-medium transition ${
                completed
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              다음 강의 →
            </Link>
          ) : (
            <Link
              href={`/course/${lesson.course_id}`}
              className="flex-1 py-2.5 text-center bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              강의 목록으로 ✓
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  )
}
