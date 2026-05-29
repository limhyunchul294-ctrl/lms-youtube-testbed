import Link from 'next/link'
import type { LearningStep } from '@/lib/lms/types'

export type { LearningStep }

export default function CourseLearningPath({ steps }: { steps: LearningStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const canNavigate = step.status !== 'locked'

        const content = (
          <div
            className={`flex gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 transition min-h-[56px] ${
              step.status === 'done'
                ? 'border-green-200 bg-green-50/50'
                : step.status === 'in_progress'
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                  : step.status === 'locked'
                    ? 'border-slate-100 bg-slate-50 opacity-70'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/40'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step.status === 'done'
                  ? 'bg-green-600 text-white'
                  : step.status === 'in_progress'
                    ? 'bg-[var(--accent)] text-white'
                    : step.status === 'locked'
                      ? 'bg-slate-200 text-slate-500'
                      : 'bg-slate-100 text-slate-600'
              }`}
            >
              {step.status === 'done' ? '✓' : i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-[var(--text)]">{step.label}</p>
              {step.detail && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{step.detail}</p>
              )}
            </div>
            {canNavigate && (
              <span className="self-center text-xs font-medium text-[var(--accent)]">이동 →</span>
            )}
          </div>
        )

        return (
          <li key={step.key} className="relative">
            {!isLast && (
              <span
                className="absolute left-[1.65rem] top-14 bottom-0 w-px bg-[var(--border)]"
                aria-hidden
              />
            )}
            {canNavigate ? (
              <Link href={step.href} className="block mb-3 touch-manipulation">
                {content}
              </Link>
            ) : (
              <div className="mb-3">{content}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
