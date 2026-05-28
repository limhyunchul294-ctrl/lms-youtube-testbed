/** URL 경로 — slug 우선, 없으면 uuid (하위 호환) */

export function publicRef(entity: { id: string; slug?: string | null }): string {
  return entity.slug?.trim() || entity.id
}

export function coursePath(ref: string, sub?: 'certificate'): string {
  return sub ? `/course/${ref}/${sub}` : `/course/${ref}`
}

export function lessonPath(ref: string): string {
  return `/lesson/${ref}`
}

export function activityPath(ref: string): string {
  return `/activity/${ref}`
}
