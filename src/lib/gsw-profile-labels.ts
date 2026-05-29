/** GSW 포털 portalAccess.js 와 동일한 표기 */

export function formatGswGradeLabel(grade?: string | null): string {
  const g = String(grade || '').toLowerCase()
  if (g === 'black' || g === 'supervisor') return '⚫ 블랙'
  if (g === 'silver') return '⚪ 실버'
  if (g === 'blue') return '🔵 블루'
  return grade ? String(grade) : '등급 없음'
}

export function formatGswRoleLabel(role?: string | null): string {
  const r = String(role || '').toLowerCase()
  if (r === 'admin') return '관리자'
  if (r === 'user') return '사용자'
  return role ? String(role) : ''
}

export type GswProfileLine = { label: string; value: string }

/** GSW «내 정보» 순서와 동일한 사이드바 라인 */
export function buildGswProfileLines(profile: {
  department?: string | null
  gsw_role?: string | null
  phone?: string | null
  gsw_grade?: string | null
  gsw_username?: string | null
  gsw_user_id?: string | null
  email?: string | null
}): GswProfileLine[] {
  const lines: GswProfileLine[] = []

  if (profile.department?.trim()) {
    lines.push({ label: '소속', value: profile.department.trim() })
  }
  const roleLabel = formatGswRoleLabel(profile.gsw_role)
  if (roleLabel) lines.push({ label: '권한', value: roleLabel })
  if (profile.phone?.trim()) {
    lines.push({ label: '연락처', value: profile.phone.trim() })
  }
  if (profile.gsw_grade?.trim()) {
    lines.push({ label: '등급', value: formatGswGradeLabel(profile.gsw_grade) })
  }
  if (profile.gsw_username?.trim()) {
    lines.push({ label: '아이디', value: profile.gsw_username.trim() })
  }
  if (profile.email?.trim()) {
    lines.push({ label: '이메일', value: profile.email.trim() })
  }
  if (profile.gsw_user_id?.trim()) {
    lines.push({ label: '포털 ID', value: profile.gsw_user_id.trim() })
  }

  return lines
}
