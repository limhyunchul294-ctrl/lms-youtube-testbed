export type ExamQuestion = {
  id: string
  label: string
  options: string[]
  correct: number
  kind?: 'recall' | 'case'
  stem?: string
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
        {questions.some((q) => q.kind === 'case') && (
          <>
            {' '}
            · 사례판단{' '}
            <strong>{questions.filter((q) => q.kind === 'case').length}</strong>문항 포함
          </>
        )}
      </p>
      {questions.map((q, qi) => (
        <fieldset
          key={q.id}
          disabled={disabled}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-5"
        >
          <legend className="text-sm font-medium text-[var(--text)] mb-3 block w-full">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs mr-2">
              {qi + 1}
            </span>
            {q.kind === 'case' && (
              <span className="inline-block mr-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-800">
                사례
              </span>
            )}
            {q.label}
          </legend>
          {q.stem && (
            <p className="text-sm text-[var(--text-muted)] mb-3 leading-relaxed whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 border border-[var(--border)]">
              {q.stem}
            </p>
          )}
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
