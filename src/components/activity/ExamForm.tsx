export type ExamQuestion = {
  id: string
  label: string
  options: string[]
  correct: number
}

export default function ExamForm({
  questions,
  passScore,
  answers,
  onChange,
  disabled,
}: {
  questions: ExamQuestion[]
  passScore: number
  answers: Record<string, string | number>
  onChange: (answers: Record<string, string | number>) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)] rounded-lg bg-[var(--accent-soft)] px-3 py-2">
        합격 기준: <strong className="text-[var(--accent)]">{passScore}점</strong> 이상 · 문항{' '}
        {questions.length}개
      </p>
      {questions.map((q, qi) => (
        <fieldset
          key={q.id}
          disabled={disabled}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-5"
        >
          <legend className="text-sm font-medium text-[var(--text)] mb-3 block">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs mr-2">
              {qi + 1}
            </span>
            {q.label}
          </legend>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm cursor-pointer touch-manipulation min-h-[48px] ${
                  Number(answers[q.id]) === oi
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)]'
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  disabled={disabled}
                  checked={Number(answers[q.id]) === oi}
                  onChange={() => onChange({ ...answers, [q.id]: oi })}
                  className="h-5 w-5 accent-[var(--accent)]"
                />
                <span className="flex-1">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
