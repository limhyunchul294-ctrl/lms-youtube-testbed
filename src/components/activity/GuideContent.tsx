type Section = { title: string; body: string }

export default function GuideContent({
  sections,
  acknowledged,
  onAcknowledgedChange,
  disabled,
}: {
  sections: Section[]
  acknowledged: boolean
  onAcknowledgedChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      {sections.map((s, i) => (
        <section
          key={i}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-5"
        >
          <h2 className="font-semibold text-[var(--text)] text-base">{s.title}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed whitespace-pre-wrap">
            {s.body}
          </p>
        </section>
      ))}
      <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm cursor-pointer touch-manipulation">
        <input
          type="checkbox"
          checked={acknowledged}
          disabled={disabled}
          onChange={(e) => onAcknowledgedChange(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
        />
        <span>위 안내 내용을 확인했으며, 수강 규정에 동의합니다.</span>
      </label>
    </div>
  )
}
