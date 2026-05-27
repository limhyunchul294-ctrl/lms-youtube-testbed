'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import type { Course } from '@/lib/types'
import { isDemoCourseId } from '@/lib/evkmc'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set())
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

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('sort_order')

      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)

      setCourses((coursesData || []).filter((c) => !isDemoCourseId(c.id)))
      setEnrolled(new Set(enrollData?.map((e) => e.course_id) || []))
      setLoading(false)
    }
    init()
  }, [router, supabase])

  const handleEnroll = async (courseId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId })
    setEnrolled((prev) => new Set([...prev, courseId]))
    router.push(`/course/${courseId}`)
  }

  return (
    <AppShell title="강의 탐색" subtitle="수강 신청 후 학습 허브에서 안내·평가·시험을 진행합니다.">
      {loading ? (
        <div className="text-center py-20 text-sm text-[var(--text-muted)]">불러오는 중…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden card-hover"
            >
              <div className="aspect-video bg-gradient-to-br from-[var(--accent-soft)] to-slate-100 flex items-center justify-center">
                <span className="text-4xl">{course.title.includes('고전압') ? '⚡' : '🌱'}</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[var(--text)]">{course.title}</h3>
                {course.description && (
                  <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="mt-4">
                  {enrolled.has(course.id) ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/course/${course.id}`)}
                      className="w-full py-2 bg-slate-100 text-[var(--text)] text-sm font-medium rounded-lg hover:bg-slate-200"
                    >
                      학습 허브 열기 →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEnroll(course.id)}
                      className="w-full py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:opacity-90"
                    >
                      수강 신청
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
