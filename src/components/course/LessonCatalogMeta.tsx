'use client'

import { getCatalogLessonMeta } from '@/lib/lms/catalog'

export default function LessonCatalogMeta({ lessonId }: { lessonId: string }) {
  const meta = getCatalogLessonMeta(lessonId)
  if (!meta?.learning_objectives?.length) return null

  return (
    <ul className="mt-1.5 space-y-0.5 list-disc list-inside text-[11px] text-[var(--text-muted)]">
      {meta.learning_objectives.map((o) => (
        <li key={o}>{o}</li>
      ))}
    </ul>
  )
}
