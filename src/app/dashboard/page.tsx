'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import type { Course } from '@/lib/types'

interface CourseWithProgress extends Course {
  total_lessons: number
  completed_lessons: number
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // 수강 등록된 강의 + 진도율
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)

      if (!enrollments?.length) { setLoading(false); return }

      const courseIds = enrollments.map(e => e.course_id)

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds)
        .order('sort_order')

      // 각 강의의 진도율 계산
      const withProgress = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { count: totalLessons } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)

          const { count: completedLessons } = await supabase
            .from('user_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_completed', true)
            .in('lesson_id',
              (await supabase.from('lessons').select('id').eq('course_id', course.id))
                .data?.map(l => l.id) || []
            )

          return {
            ...course,
            total_lessons: totalLessons || 0,
            completed_lessons: completedLessons || 0,
          }
        })
      )

      setCourses(withProgress)
      setLoading(false)
    }
    init()
  }, [])

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">내 강의</h1>
          <p className="text-sm text-slate-500 mt-0.5">수강 중인 강의 목록과 진도율을 확인하세요.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">불러오는 중...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🎓</div>
            <p className="text-slate-500 text-sm">아직 수강 중인 강의가 없습니다.</p>
            <Link href="/courses" className="mt-3 inline-block text-sm text-blue-600 font-medium hover:underline">
              강의 둘러보기 →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => {
              const pct = course.total_lessons > 0
                ? Math.round((course.completed_lessons / course.total_lessons) * 100)
                : 0
              return (
                <Link
                  key={course.id}
                  href={`/course/${course.id}`}
                  className="card-hover bg-white rounded-xl border border-slate-200 p-5 block"
                >
                  {/* 썸네일 */}
                  {course.thumbnail_url && (
                    <div className="aspect-video rounded-lg bg-slate-100 mb-4 overflow-hidden">
                      <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h3 className="font-semibold text-slate-900">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                  )}
                  {/* 진도 바 */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-slate-500">
                        {course.completed_lessons}/{course.total_lessons} 강의 완료
                      </span>
                      <span className={`text-xs font-semibold ${pct === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-bar-fill ${pct === 100 ? 'complete' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
