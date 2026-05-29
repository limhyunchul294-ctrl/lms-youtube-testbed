'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import GuideContent from '@/components/activity/GuideContent'
import EvaluationForm, { type EvalQuestion } from '@/components/activity/EvaluationForm'
import ExamForm, { type ExamQuestion } from '@/components/activity/ExamForm'
import NextActionBanner from '@/components/course/NextActionBanner'
import { checkActivityAccess, resolveActivityNextAction } from '@/lib/lms'
import { createClient } from '@/lib/supabase'
import { activityPath, coursePath } from '@/lib/routes'
import { resolveActivityId, shouldRedirectToSlug } from '@/lib/resolve-ref'
import type { ScenarioCard } from '@/data/evkmc-scenarios'
import type { ActivityType, CourseActivity } from '@/lib/types'

export default function ActivityPage() {
  const { id: ref } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [activity, setActivity] = useState<CourseActivity | null>(null)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseRef, setCourseRef] = useState('')
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [acknowledged, setAcknowledged] = useState(false)
  const [gateMessage, setGateMessage] = useState<string | null>(null)
  const [gateLink, setGateLink] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ passed: boolean; score?: number; message: string } | null>(
    null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const resolved = await resolveActivityId(supabase, ref)
      if (!resolved) {
        router.push('/dashboard')
        return
      }

      if (shouldRedirectToSlug(ref, resolved.slug)) {
        router.replace(activityPath(resolved.slug))
        return
      }

      const { data: act } = await supabase
        .from('course_activities')
        .select('*')
        .eq('id', resolved.id)
        .single()

      if (!act) {
        router.push('/dashboard')
        return
      }

      setActivity(act as CourseActivity)

      const { data: course } = await supabase
        .from('courses')
        .select('title, slug')
        .eq('id', act.course_id)
        .single()
      setCourseTitle(course?.title || '')
      setCourseRef(course?.slug || act.course_id)

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', act.course_id)
        .maybeSingle()

      if (!enrollment) {
        setGateMessage('먼저 수강 신청 후 이 활동을 이용할 수 있습니다.')
        setGateLink(coursePath(course?.slug || act.course_id))
        setLoading(false)
        return
      }

      let guideAcknowledged = false
      let lessonsComplete = false
      let evaluationPassed = false

      try {
        const { data: guideAct } = await supabase
          .from('course_activities')
          .select('id')
          .eq('course_id', act.course_id)
          .eq('activity_type', 'guide')
          .maybeSingle()

        if (guideAct?.id) {
          const { data: guideSub } = await supabase
            .from('activity_submissions')
            .select('answers')
            .eq('activity_id', guideAct.id)
            .eq('user_id', user.id)
            .maybeSingle()

          guideAcknowledged =
            (guideSub?.answers as { acknowledged?: boolean } | null)?.acknowledged === true
        }

        const { data: st } = await supabase.rpc('get_course_learning_status', {
          p_course_id: act.course_id,
        })
        lessonsComplete = !!st?.[0]?.lessons_complete

        const { data: evalAct } = await supabase
          .from('course_activities')
          .select('id')
          .eq('course_id', act.course_id)
          .eq('activity_type', 'evaluation')
          .maybeSingle()

        if (evalAct?.id) {
          const { data: evalSub } = await supabase
            .from('activity_submissions')
            .select('passed')
            .eq('activity_id', evalAct.id)
            .eq('user_id', user.id)
            .maybeSingle()

          evaluationPassed = evalSub?.passed === true
        }
      } catch (e) {
        console.warn('activity gate status failed', e)
      }

      const hub = coursePath(course?.slug || act.course_id)
      const access = checkActivityAccess(act, {
        guideAcknowledged,
        lessonsComplete,
        evaluationPassed,
        hubHref: hub,
      })

      if (!access.allowed) {
        setGateMessage(access.message)
        setGateLink(access.hubHref)
        setLoading(false)
        return
      }

      const { data: sub } = await supabase
        .from('activity_submissions')
        .select('*')
        .eq('activity_id', resolved.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (sub?.answers && typeof sub.answers === 'object') {
        const a = sub.answers as Record<string, unknown>
        if (a.acknowledged) setAcknowledged(true)
        setResult(
          sub.passed != null
            ? {
                passed: !!sub.passed,
                score: sub.score ?? undefined,
                message: sub.passed ? '이미 완료했습니다.' : '제출 기록이 있습니다.',
              }
            : null
        )
      }

      setLoading(false)
    }
    init()
  }, [ref, router, supabase])

  const submit = async () => {
    if (!activity) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let payload: Record<string, unknown> = {}
    let score: number | null = null
    let passed: boolean | null = null

    if (activity.activity_type === 'guide') {
      if (!acknowledged) {
        setSubmitting(false)
        return
      }
      payload = { acknowledged: true }
      passed = true
    } else if (activity.activity_type === 'evaluation') {
      const questions = (activity.config?.questions as EvalQuestion[]) || []
      payload = { ...answers }
      passed = questions.every((q) => {
        if (q.optional) return true
        return answers[q.id] !== undefined && answers[q.id] !== ''
      })
      score = passed ? 100 : 0
    } else if (activity.activity_type === 'exam') {
      const questions = (activity.config?.questions as ExamQuestion[]) || []
      const passScore = Number(activity.config?.pass_score ?? 70)
      let correct = 0
      questions.forEach((q) => {
        if (Number(answers[q.id]) === q.correct) correct++
      })
      score = questions.length ? Math.round((correct / questions.length) * 100) : 0
      passed = score >= passScore

      const { data: prevSub } = await supabase
        .from('activity_submissions')
        .select('answers')
        .eq('activity_id', activity.id)
        .eq('user_id', user.id)
        .maybeSingle()
      const prevAttempts = Number(
        (prevSub?.answers as { attempt_count?: number } | null)?.attempt_count ?? 0
      )

      payload = {
        ...answers,
        correct_count: correct,
        total: questions.length,
        attempt_count: prevAttempts + 1,
      }
    }

    const { error } = await supabase.from('activity_submissions').upsert(
      {
        user_id: user.id,
        activity_id: activity.id,
        answers: payload,
        score,
        passed,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,activity_id' }
    )

    setSubmitting(false)
    if (error) {
      setResult({ passed: false, message: error.message })
      return
    }

    setResult({
      passed: !!passed,
      score: score ?? undefined,
      message: passed
        ? activity.activity_type === 'exam'
          ? `합격입니다. (${score}점)`
          : '제출이 완료되었습니다.'
        : activity.activity_type === 'exam'
          ? `불합격입니다. (${score}점) — 다시 응시할 수 있습니다.`
          : '필수 항목을 모두 입력해 주세요.',
    })
  }

  if (loading || !activity) {
    return (
      <AppShell>
        <div className="text-center py-20 text-sm text-[var(--text-muted)]">불러오는 중…</div>
      </AppShell>
    )
  }

  const typeLabel: Record<ActivityType, string> = {
    guide: '강의 안내',
    evaluation: '강의 평가',
    exam: '시험',
  }

  const sections = (activity.config?.sections as { title: string; body: string }[]) || []
  const scenarios = (activity.config?.scenarios as ScenarioCard[]) || []
  const evalQuestions = (activity.config?.questions as EvalQuestion[]) || []
  const examQuestions = (activity.config?.questions as ExamQuestion[]) || []
  const hubHref = coursePath(courseRef)
  const activityNext = resolveActivityNextAction(activity.activity_type, {
    passed: !!result?.passed,
    hubHref,
  })

  return (
    <AppShell
      title={activity.title}
      subtitle={`${courseTitle} · ${typeLabel[activity.activity_type]}`}
    >
      <Link
        href={hubHref}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] mb-4 inline-block touch-manipulation"
      >
        ← 강의 허브로
      </Link>

      {activity.description && (
        <p className="text-sm text-[var(--text-muted)] mb-6">{activity.description}</p>
      )}
      {!gateMessage && (
        <NextActionBanner
          title={activityNext.title}
          detail={activityNext.detail}
          href={activityNext.href}
          ctaLabel={activityNext.ctaLabel}
        />
      )}

      {gateMessage && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium mb-1">진입 제한</p>
          <p className="text-[var(--text-muted)] whitespace-pre-wrap">{gateMessage}</p>
          {gateLink && (
            <Link
              href={gateLink}
              className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline touch-manipulation"
            >
              필수 단계로 이동 →
            </Link>
          )}
        </div>
      )}

      {!gateMessage && activity.activity_type === 'guide' && (
        <div className="mb-6">
          <GuideContent
            sections={sections}
            scenarios={scenarios}
            acknowledged={acknowledged}
            onAcknowledgedChange={setAcknowledged}
            disabled={!!result?.passed}
          />
        </div>
      )}

      {!gateMessage && activity.activity_type === 'evaluation' && (
        <div className="mb-6">
          <EvaluationForm
            questions={evalQuestions}
            answers={answers}
            onChange={setAnswers}
            disabled={!!result?.passed}
          />
        </div>
      )}

      {!gateMessage && activity.activity_type === 'exam' && (
        <div className="mb-6">
          <ExamForm
            questions={examQuestions}
            passScore={Number(activity.config?.pass_score ?? 70)}
            answers={answers}
            onChange={setAnswers}
            disabled={!!result?.passed}
          />
        </div>
      )}

      {result && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            result.passed ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'
          }`}
        >
          {result.message}
        </div>
      )}

      {!gateMessage && !result?.passed && (
        <button
          type="button"
          disabled={submitting}
          onClick={submit}
          className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 touch-manipulation"
        >
          {submitting ? '제출 중…' : activity.activity_type === 'exam' ? '시험 제출' : '제출하기'}
        </button>
      )}

      {result?.passed && (
        <Link
          href={hubHref}
          className="inline-block mt-4 text-sm font-medium text-[var(--accent)] hover:underline touch-manipulation"
        >
          강의 허브로 돌아가기 →
        </Link>
      )}
    </AppShell>
  )
}
