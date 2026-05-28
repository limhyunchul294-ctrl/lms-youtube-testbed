import type { SupabaseClient } from '@supabase/supabase-js'

/** 페이지 워터마크에 표시할 학습자 식별 문자열 */
export async function fetchLearnerWatermarkLabel(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  let label = user.email || user.id

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.email) {
      label = profile.email
    } else if (profile?.display_name && user.email) {
      label = `${profile.display_name} (${user.email})`
    } else if (profile?.display_name) {
      label = profile.display_name
    }
  } catch {
    // profiles 미적용 환경
  }

  return label
}

export function formatWatermarkLine(label: string): string {
  const ts = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return `EVKMC · ${label} · ${ts}`
}
