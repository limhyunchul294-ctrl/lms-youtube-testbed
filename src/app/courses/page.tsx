'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import type { Course } from '@/lib/types'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('sort_order')

      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)

      setCourses(coursesData || [])
      setEnrolled(new Set(enrollData?.map(e => e.course_id) || []))
      setLoading(false)
    }
    init()
  }, [])

  const handleEnroll = async (courseId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId })
    setEnrolled(prev => new Set([...prev, courseId]))
    router.push(`/course/${courseId}`)
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">전체 강의</h1>
          <p className="text-sm text-slate-500 mt-0.5">수강 신청 후 학습을 시작하세요.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">불러오는 중...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden card-hover"
              >
                {course.thumbnail_url ? (
                  <div className="aspect-video bg-slate-100">
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <span className="text-4xl">🎬</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                  )}
                  <div className="mt-4">
                    {enrolled.has(course.id) ? (
                      <button
                        onClick={() => router.push(`/course/${course.id}`)}
                        className="w-full py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition"
                      >
                        이어서 학습하기 →
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-[0.98] transition"
                      >
                        수강 신청 (무료)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
