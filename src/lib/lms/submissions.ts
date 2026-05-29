import type { CourseActivity } from '@/lib/types'

type SubmissionRow = {
  activity_id: string
  passed?: boolean | null
  answers?: Record<string, unknown> | null
}

/** 활동 제출 여부 → 완료 activity_id 집합 */
export function buildCompletedActivityIds(
  activities: CourseActivity[],
  submissions: SubmissionRow[]
): Set<string> {
  const done = new Set<string>()
  for (const s of submissions) {
    const act = activities.find((a) => a.id === s.activity_id)
    if (!act) continue
    if (act.activity_type === 'guide') {
      if ((s.answers as { acknowledged?: boolean } | null)?.acknowledged) {
        done.add(s.activity_id)
      }
    }
    if ((act.activity_type === 'evaluation' || act.activity_type === 'exam') && s.passed) {
      done.add(s.activity_id)
    }
  }
  return done
}
