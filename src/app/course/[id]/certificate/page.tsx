'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase'
import type { Course, CourseLearningStatus } from '@/lib/types'

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [course, setCourse] = useState<Course | null>(null)
  const [learnerName, setLearnerName] = useState('')
  const [department, setDepartment] = useState('')
  const [completedAt, setCompletedAt] = useState('')
  const [allowed, setAllowed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data: courseData } = await supabase.from('courses').select('*').eq('id', id).single()
      setCourse(courseData)

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, department')
        .eq('id', user.id)
        .maybeSingle()

      setLearnerName(profile?.display_name || user.email?.split('@')[0] || '수강생')
      setDepartment(profile?.department || '')

      const { data: st } = await supabase.rpc('get_course_learning_status', { p_course_id: id })
      const status = st?.[0] as CourseLearningStatus | undefined
      setAllowed(!!status?.course_complete)

      const { data: examAct } = await supabase
        .from('course_activities')
        .select('id')
        .eq('course_id', id)
        .eq('activity_type', 'exam')
        .maybeSingle()

      const { data: examSub } = examAct
        ? await supabase
            .from('activity_submissions')
            .select('submitted_at')
            .eq('user_id', user.id)
            .eq('activity_id', examAct.id)
            .eq('passed', true)
            .maybeSingle()
        : { data: null }

      setCompletedAt(
        examSub?.submitted_at
          ? new Date(examSub.submitted_at).toLocaleDateString('ko-KR')
          : new Date().toLocaleDateString('ko-KR')
      )

      setLoading(false)
    }
    init()
  }, [id, router, supabase])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-center py-20 text-sm text-[var(--text-muted)]">불러오는 중…</div>
      </AppShell>
    )
  }

  if (!allowed) {
    return (
      <AppShell title="수료증" subtitle={course?.title}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          수료 조건(영상·평가·시험)을 모두 완료한 후 수료증을 발급받을 수 있습니다.
        </div>
        <Link
          href={`/course/${id}`}
          className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← 강의 허브로
        </Link>
      </AppShell>
    )
  }

  return (
    <AppShell title="수료증" subtitle={course?.title}>
      <div className="print:hidden mb-4 flex gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium"
        >
          인쇄 / PDF 저장
        </button>
        <Link
          href={`/course/${id}`}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm"
        >
          강의 허브
        </Link>
      </div>

      <div
        id="certificate"
        className="certificate-sheet mx-auto max-w-2xl rounded-2xl border-2 border-[var(--accent)] bg-white p-8 md:p-12 text-center shadow-sm"
      >
        <p className="text-xs tracking-[0.3em] text-[var(--text-muted)] uppercase">EVKMC</p>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mt-4">교육 이수 증명서</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">Certificate of Completion</p>

        <div className="my-10 space-y-3 text-left max-w-md mx-auto text-sm">
          <p>
            <span className="text-[var(--text-muted)]">성명</span>
            <span className="ml-3 font-semibold text-lg text-[var(--text)]">{learnerName}</span>
          </p>
          {department && (
            <p>
              <span className="text-[var(--text-muted)]">소속</span>
              <span className="ml-3 font-medium">{department}</span>
            </p>
          )}
          <p>
            <span className="text-[var(--text-muted)]">과정명</span>
            <span className="ml-3 font-medium">{course?.title}</span>
          </p>
          <p>
            <span className="text-[var(--text-muted)]">수료일</span>
            <span className="ml-3 font-medium">{completedAt}</span>
          </p>
        </div>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-lg mx-auto">
          위 수강생은 본 교육과정의 영상 수강, 만족도 평가 및 온라인 시험 요건을 충족하였음을 증명합니다.
        </p>

        <div className="mt-12 pt-6 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
          EVKMC LMS · lms-youtube-testbed
        </div>
      </div>
    </AppShell>
  )
}
