'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import YouTubePlayer from '@/components/YouTubePlayer'
import type { Lesson, UserProgress } from '@/lib/types'

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [prevNext, setPrevNext] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null })
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // 레슨 정보
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single()

      if (!lessonData) { router.push('/dashboard'); return }
      setLesson(lessonData)

      // 기존 진도
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', id)
        .maybeSingle()

      setProgress(progressData)
      setCompleted(progressData?.is_completed ?? false)

      // 이전/다음 레슨
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
  }, [id])

  if (loading || !lesson) {
    return (
      <>
        <Navbar />
        <div className="text-center py-20 text-slate-400 text-sm">불러오는 중...</div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        {/* 뒤로가기 */}
        <Link
          href={`/course/${lesson.course_id}`}
          className="text-xs text-slate-400 hover:text-slate-600 mb-3 inline-block"
        >
          ← 강의 목록으로
        </Link>

        {/* 레슨 제목 */}
        <h1 className="text-lg font-bold text-slate-900 mb-4">{lesson.title}</h1>

        {/* 비디오 플레이어 */}
        <YouTubePlayer
          youtubeId={lesson.youtube_id}
          lessonId={lesson.id}
          durationSeconds={lesson.duration_seconds}
          initialWatched={progress?.watched_seconds}
          onComplete={() => setCompleted(true)}
        />

        {/* 이전/다음 네비게이션 */}
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
      </main>
    </>
  )
}
