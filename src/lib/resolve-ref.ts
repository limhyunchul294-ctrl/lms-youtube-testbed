import type { SupabaseClient } from '@supabase/supabase-js'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(ref: string): boolean {
  return UUID_RE.test(ref)
}

/** URL에 UUID가 들어왔을 때 공개 slug로 치환할지 */
export function shouldRedirectToSlug(ref: string, slug: string | null | undefined): slug is string {
  return isUuid(ref) && !!slug?.trim()
}

export async function resolveCourseId(
  supabase: SupabaseClient,
  ref: string
): Promise<{ id: string; slug: string | null } | null> {
  if (isUuid(ref)) {
    const { data } = await supabase.from('courses').select('id, slug').eq('id', ref).maybeSingle()
    return data ? { id: data.id, slug: data.slug } : null
  }
  const { data } = await supabase.from('courses').select('id, slug').eq('slug', ref).maybeSingle()
  return data ? { id: data.id, slug: data.slug } : null
}

export async function resolveLessonId(
  supabase: SupabaseClient,
  ref: string
): Promise<{ id: string; slug: string | null; course_id: string } | null> {
  const select = 'id, slug, course_id'
  if (isUuid(ref)) {
    const { data } = await supabase.from('lessons').select(select).eq('id', ref).maybeSingle()
    return data ?? null
  }
  const { data } = await supabase.from('lessons').select(select).eq('slug', ref).maybeSingle()
  return data ?? null
}

export async function resolveActivityId(
  supabase: SupabaseClient,
  ref: string
): Promise<{ id: string; slug: string | null; course_id: string } | null> {
  const select = 'id, slug, course_id'
  if (isUuid(ref)) {
    const { data } = await supabase
      .from('course_activities')
      .select(select)
      .eq('id', ref)
      .maybeSingle()
    return data ?? null
  }
  const { data } = await supabase
    .from('course_activities')
    .select(select)
    .eq('slug', ref)
    .maybeSingle()
  return data ?? null
}
