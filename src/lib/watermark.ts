import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchLearnerProfile, syncProfileFromAuthUser } from '@/lib/profile'

/** 페이지 워터마크에 표시할 학습자 식별 문자열 */
export async function fetchLearnerWatermarkLabel(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  let profile = await fetchLearnerProfile(supabase, user.id)
  if (!profile?.gsw_user_id && user.user_metadata?.gsw_user_id) {
    profile = await syncProfileFromAuthUser(supabase, user)
  }

  if (profile?.gsw_user_id) {
    const name = profile.display_name || profile.email
    const idPart = profile.employee_no
      ? `사번:${profile.employee_no}`
      : `GSW:${profile.gsw_user_id}`
    return `${name} · ${idPart}`
  }

  return profile?.email || user.email || user.id
}

export function formatWatermarkLine(label: string): string {
  const ts = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return `EVKMC · ${label} · ${ts}`
}
