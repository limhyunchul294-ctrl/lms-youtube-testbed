'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import type { Course, LessonWithProgress } from '@/lib/types'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<LessonWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // 강의 정보
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()
      setCourse(courseData)

      // 레슨 + 진도 (RPC 함수 사용)
      const { data: lessonsData } = await supabase
        .rpc('get_my_course_progress', { p_course_id: id })

      setLessons(lessonsData || [])
      setLoading(false)
    }
    init()
  }, [id])

  const completedCount = lessons.filter(l => l.is_completed).length
  const totalCount = lessons.length
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const formatDuration = (s: number) => {
    if (s <= 0) return ''
    const m = Math.floor(s / 60)
    return `${m}분`
  }

  if (loading) {
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
        {/* 강의 헤더 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-slate-600 mb-2 inline-block">
            ← 내 강의로
          </Link>
          <h1 className="text-xl font-bold text-slate-900">{course?.title}</h1>
          {course?.description && (
            <p className="text-sm text-slate-500 mt-1">{course.description}</p>
          )}
          {/* 전체 진도 */}
          <div className="mt-4 bg-slate-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600 font-medium">전체 진도율</span>
              <span className={`text-sm font-bold ${overallPct === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                {overallPct}%
              </span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div
                className={`progress-bar-fill ${overallPct === 100 ? 'complete' : ''}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {completedCount}/{totalCount} 강의 수강 완료
              {overallPct === 100 && ' 🎉'}
            </p>
          </div>
        </div>

        {/* 레슨 목록 */}
        <div className="space-y-2">
          {lessons.map((lesson, idx) => (
            <Link
              key={lesson.lesson_id}
              href={`/lesson/${lesson.lesson_id}`}
              className="card-hover flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 block"
            >
              {/* 번호/체크 */}
              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                lesson.is_completed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {lesson.is_completed ? '✓' : idx + 1}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium ${
                  lesson.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'
                }`}>
                  {lesson.lesson_title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {lesson.duration_seconds > 0 && (
                    <span className="text-xs text-slate-400">{formatDuration(lesson.duration_seconds)}</span>
                  )}
                  {lesson.watched_seconds > 0 && !lesson.is_completed && (
                    <span className="text-xs text-blue-500">
                      {formatDuration(lesson.watched_seconds)} 시청
                    </span>
                  )}
                </div>
              </div>

              {/* 화살표 */}
              <span className="text-slate-300 text-sm">›</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
