'use client'

import type { ActivityType, CourseActivity } from '@/lib/types'
import GuideContent from '@/components/activity/GuideContent'
import EvaluationForm, { type EvalQuestion } from '@/components/activity/EvaluationForm'
import ExamForm, { type ExamQuestion } from '@/components/activity/ExamForm'

type Props = {
  activity: CourseActivity
  configJson: string
  onConfigJsonChange: (json: string) => void
  advanced: boolean
  onAdvancedChange: (v: boolean) => void
}

export default function ActivityVisualEditor({
  activity,
  configJson,
  onConfigJsonChange,
  advanced,
  onAdvancedChange,
}: Props) {
  const config = safeParse(configJson)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => onAdvancedChange(false)}
          className={`px-3 py-2 text-xs rounded-lg font-medium touch-manipulation min-h-[40px] ${
            !advanced ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)]'
          }`}
        >
          화면 미리보기
        </button>
        <button
          type="button"
          onClick={() => onAdvancedChange(true)}
          className={`px-3 py-2 text-xs rounded-lg font-medium touch-manipulation min-h-[40px] ${
            advanced ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)]'
          }`}
        >
          JSON config
        </button>
      </div>

      {advanced ? (
        <textarea
          value={configJson}
          onChange={(e) => onConfigJsonChange(e.target.value)}
          className="w-full h-[420px] font-mono text-xs border border-[var(--border)] rounded-xl p-3"
          spellCheck={false}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-3 md:p-4 bg-slate-50/50 max-h-[520px] overflow-y-auto">
          <p className="text-xs text-[var(--text-muted)] mb-3">학습자에게 보이는 형태 (미리보기)</p>
          <Preview activityType={activity.activity_type} config={config} />
        </div>
      )}
    </div>
  )
}

function Preview({
  activityType,
  config,
}: {
  activityType: ActivityType
  config: Record<string, unknown> | null
}) {
  if (!config) {
    return <p className="text-sm text-red-600">JSON 형식이 올바르지 않습니다.</p>
  }

  if (activityType === 'guide') {
    const sections = (config.sections as { title: string; body: string }[]) || []
    return (
      <GuideContent
        sections={sections}
        acknowledged={false}
        onAcknowledgedChange={() => {}}
        disabled
      />
    )
  }

  if (activityType === 'evaluation') {
    const questions = (config.questions as EvalQuestion[]) || []
    return <EvaluationForm questions={questions} answers={{}} onChange={() => {}} disabled />
  }

  if (activityType === 'exam') {
    const questions = (config.questions as ExamQuestion[]) || []
    const passScore = Number(config.pass_score ?? 70)
    return (
      <ExamForm
        questions={questions}
        passScore={passScore}
        answers={{}}
        onChange={() => {}}
        disabled
      />
    )
  }

  return null
}

function safeParse(json: string): Record<string, unknown> | null {
  try {
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}
