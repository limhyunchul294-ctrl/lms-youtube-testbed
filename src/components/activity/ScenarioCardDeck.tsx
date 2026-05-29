import type { ScenarioCard } from '@/data/evkmc-scenarios'

const STEPS = [
  { key: 'symptom' as const, label: '증상', accent: 'border-amber-200 bg-amber-50/80' },
  { key: 'diagnosis' as const, label: '진단', accent: 'border-blue-200 bg-blue-50/80' },
  { key: 'action' as const, label: '조치', accent: 'border-emerald-200 bg-emerald-50/80' },
]

export default function ScenarioCardDeck({ scenarios }: { scenarios: ScenarioCard[] }) {
  if (!scenarios.length) return null

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <h2 className="font-semibold text-[var(--text)] text-base">현업 시나리오 카드</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          증상 → 진단 → 조치 순서로 사고 흐름을 익혀 보세요.
        </p>
      </div>
      {scenarios.map((card, i) => (
        <article
          key={i}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
        >
          {card.title && (
            <header className="px-4 py-2.5 border-b border-[var(--border)] bg-slate-50/80">
              <h3 className="text-sm font-semibold text-[var(--text)]">{card.title}</h3>
            </header>
          )}
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
            {STEPS.map((step) => (
              <div key={step.key} className={`p-4 ${step.accent}`}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                  {step.label}
                </p>
                <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                  {card[step.key]}
                </p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}
