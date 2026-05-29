'use client'

import Link from 'next/link'
import type { LearnerProfile } from '@/lib/profile'
import { buildGswProfileSummary } from '@/lib/gsw-profile-labels'

export default function SidebarProfile({
  profile,
  compact,
}: {
  profile: LearnerProfile | null
  compact?: boolean
}) {
  if (!profile) return null

  const summary = buildGswProfileSummary(profile)
  const name = profile.display_name || profile.email

  return (
    <Link
      href="/account"
      className={`block rounded-lg transition-colors touch-manipulation hover:bg-slate-50 ${
        compact ? 'p-1 -m-1' : 'p-2 -m-2'
      }`}
    >
      <p className={`font-medium text-[var(--text)] truncate ${compact ? 'text-xs' : 'text-sm'}`}>
        {name}
      </p>
      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{summary}</p>
      <p className="text-[10px] text-[var(--accent)] mt-1 font-medium">내 정보 →</p>
      {!profile.gsw_user_id && (
        <p className="text-[10px] text-amber-700 mt-0.5">GSW 연동 정보 없음</p>
      )}
    </Link>
  )
}
