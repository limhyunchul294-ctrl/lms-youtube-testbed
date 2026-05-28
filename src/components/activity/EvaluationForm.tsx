export type EvalQuestion = {
  id: string
  label: string
  type: 'rating' | 'text'
  max?: number
  optional?: boolean
}

export default function EvaluationForm({
  questions,
  answers,
  onChange,
  disabled,
}: {
  questions: EvalQuestion[]
  answers: Record<string, string | number>
  onChange: (answers: Record<string, string | number>) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <fieldset
          key={q.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-5"
          disabled={disabled}
        >
          <legend className="text-sm font-medium text-[var(--text)] mb-3 px-0">
            {q.label}
            {q.optional && (
              <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">(선택)</span>
            )}
          </legend>
          {q.type === 'rating' ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: q.max || 5 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...answers, [q.id]: n })}
                  className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-semibold border transition touch-manipulation ${
                    answers[q.id] === n
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--border)] bg-white text-[var(--text)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              disabled={disabled}
              className="w-full rounded-xl border border-[var(--border)] px-3 py-3 text-base min-h-[100px]"
              value={(answers[q.id] as string) || ''}
              onChange={(e) => onChange({ ...answers, [q.id]: e.target.value })}
              placeholder="의견을 입력해 주세요"
            />
          )}
        </fieldset>
      ))}
    </div>
  )
}
