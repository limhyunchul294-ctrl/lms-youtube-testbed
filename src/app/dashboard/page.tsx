'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import type { Course, CourseLearningStatus } from '@/lib/types'
import { isDemoCourseId } from '@/lib/evkmc'

interface CourseWithProgress extends Course {
  total_lessons: number
  completed_lessons: number
  course_complete?: boolean
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [displayName, setDisplayName] = useState('')
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle()
      setDisplayName(profile?.display_name || user.email?.split('@')[0] || '학습자')

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)

      if (!enrollments?.length) {
        setLoading(false)
        return
      }

      const courseIds = enrollments.map((e) => e.course_id)
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds)
        .order('sort_order')

      const withProgress = await Promise.all(
        (coursesData || []).filter((c) => !isDemoCourseId(c.id)).map(async (course) => {
          const { count: totalLessons } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)

          const lessonIds =
            (
              await supabase.from('lessons').select('id').eq('course_id', course.id)
            ).data?.map((l) => l.id) || []

          const { count: completedLessons } = await supabase
            .from('user_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_completed', true)
            .in('lesson_id', lessonIds)

          const { data: st } = await supabase.rpc('get_course_learning_status', {
            p_course_id: course.id,
          })

          return {
            ...course,
            total_lessons: totalLessons || 0,
            completed_lessons: completedLessons || 0,
            course_complete: (st?.[0] as CourseLearningStatus)?.course_complete,
          }
        })
      )

      setCourses(withProgress)
      setLoading(false)
    }
    init()
  }, [router, supabase])

  return (
    <AppShell
      title={`안녕하세요, ${displayName}님`}
      subtitle="오늘의 학습을 이어가 보세요."
    >
      {loading ? (
        <div className="text-center py-20 text-sm text-[var(--text-muted)]">불러오는 중…</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]">
          <p className="text-[var(--text-muted)] text-sm">수강 중인 강의가 없습니다.</p>
          <Link
            href="/courses"
            className="mt-4 inline-block px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium"
          >
            강의 탐색 · 수강 신청
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => {
            const pct =
              course.total_lessons > 0
                ? Math.round((course.completed_lessons / course.total_lessons) * 100)
                : 0
            return (
              <Link
                key={course.id}
                href={`/course/${course.id}`}
                className="card-hover rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 block"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-[var(--text)]">{course.title}</h3>
                  {course.course_complete && (
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      수료
                    </span>
                  )}
                </div>
                {course.description && (
                  <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                    <span>
                      영상 {course.completed_lessons}/{course.total_lessons}
                    </span>
                    <span className="font-semibold text-[var(--accent)]">{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${course.course_complete ? 'complete' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-[var(--accent)] mt-3 font-medium">학습 허브 열기 →</p>
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--text)]">
        <strong>학습 순서:</strong> 강의 안내 확인 → 영상 수강(90% 이상) → 만족도 평가 → 온라인
        시험
      </div>
    </AppShell>
  )
}
