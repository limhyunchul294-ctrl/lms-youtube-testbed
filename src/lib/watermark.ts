import type { SupabaseClient } from '@supabase/supabase-js'
import { getClientIpAddress } from '@/lib/client-ip'
import type { LearnerProfile } from '@/lib/profile'
import { fetchLearnerProfile, syncProfileFromAuthUser } from '@/lib/profile'

/** GSW setupWatermark 와 동일: `소속 - 이름 - IP - 날짜` */
export function buildGswWatermarkText(
  profile: Pick<LearnerProfile, 'display_name' | 'department' | 'email'> | null,
  ipAddress: string
): string {
  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  if (profile) {
    const affiliation = profile.department?.trim() || '사용자'
    const name =
      profile.display_name?.trim() ||
      profile.email?.split('@')[0] ||
      '사용자'
    return `${affiliation} - ${name} - ${ipAddress} - ${dateStr}`
  }

  return `CONFIDENTIAL - ${ipAddress} - ${new Date().toLocaleDateString()}`
}

export async function fetchGswWatermarkText(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  let profile = await fetchLearnerProfile(supabase, user.id)
  const m = user.user_metadata
  const needsGswSync =
    m?.gsw_user_id &&
    (!profile?.gsw_user_id ||
      (!profile?.gsw_role && m.gsw_role) ||
      (!profile?.phone && m.phone) ||
      (!profile?.gsw_grade && m.gsw_grade) ||
      (!profile?.gsw_username && (m.gsw_username || m.username)))
  if (needsGswSync) {
    profile = await syncProfileFromAuthUser(supabase, user)
  }

  if (!profile && user.user_metadata) {
    profile = {
      id: user.id,
      email: user.email || '',
      display_name:
        (user.user_metadata.full_name as string) ||
        user.email?.split('@')[0] ||
        null,
      department: (user.user_metadata.department as string) || null,
      gsw_user_id: (user.user_metadata.gsw_user_id as string) || null,
      gsw_username: null,
      phone: null,
      gsw_role: null,
      gsw_grade: null,
      employee_no: null,
      position: null,
      company: null,
    }
  }

  const ip = await getClientIpAddress()
  return buildGswWatermarkText(profile, ip)
}
