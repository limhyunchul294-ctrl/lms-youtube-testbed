import type { SupabaseClient, User } from '@supabase/supabase-js'

export type LearnerProfile = {
  id: string
  email: string
  display_name: string | null
  department: string | null
  gsw_user_id: string | null
  employee_no: string | null
  position: string | null
  company: string | null
}

export function profileFromUserMetadata(user: User): Partial<LearnerProfile> {
  const m = user.user_metadata || {}
  return {
    id: user.id,
    email: user.email || '',
    display_name: (m.full_name as string) || (m.name as string) || null,
    department: (m.department as string) || null,
    gsw_user_id: (m.gsw_user_id as string) || null,
    employee_no: (m.employee_no as string) || (m.employee_id as string) || null,
    position: (m.position as string) || (m.title as string) || null,
    company: (m.company as string) || (m.org as string) || null,
  }
}

/** GSW 브릿지·세션 메타데이터 → profiles 동기화 */
export async function syncProfileFromAuthUser(
  supabase: SupabaseClient,
  user: User
): Promise<LearnerProfile | null> {
  const partial = profileFromUserMetadata(user)
  if (!partial.email) return null

  const row = {
    id: user.id,
    email: partial.email,
    display_name: partial.display_name || partial.email.split('@')[0],
    department: partial.department ?? null,
    gsw_user_id: partial.gsw_user_id ?? null,
    employee_no: partial.employee_no ?? null,
    position: partial.position ?? null,
    company: partial.company ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    console.warn('profile sync failed', error.message)
    const { data: existing } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    return existing as LearnerProfile | null
  }

  return data as LearnerProfile
}

export async function fetchLearnerProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<LearnerProfile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return data as LearnerProfile | null
}
