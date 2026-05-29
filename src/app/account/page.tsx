'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import AccountInfoView from '@/components/profile/AccountInfoView'
import { createClient } from '@/lib/supabase'
import type { LearnerProfile } from '@/lib/profile'
import { profileFromUserMetadata, syncProfileFromAuthUser } from '@/lib/profile'

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<LearnerProfile | null>(null)
  const [sessionEmail, setSessionEmail] = useState('')
  const [lastSignIn, setLastSignIn] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      setSessionEmail(user.email || '')
      setLastSignIn(user.last_sign_in_at || null)
      setCreatedAt(user.created_at || null)

      let row = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      let p = row.data as LearnerProfile | null

      const m = user.user_metadata
      const needsGswSync =
        m?.gsw_user_id &&
        (!p?.gsw_user_id ||
          (!p?.gsw_role && m.gsw_role) ||
          (!p?.phone && m.phone) ||
          (!p?.gsw_grade && m.gsw_grade) ||
          (!p?.gsw_username && (m.gsw_username || m.username)))
      if (needsGswSync) {
        p = await syncProfileFromAuthUser(supabase, user)
      }

      if (!p) {
        const partial = profileFromUserMetadata(user)
        p = {
          ...partial,
          id: user.id,
          email: user.email || '',
          display_name: partial.display_name || user.email?.split('@')[0] || '학습자',
        } as LearnerProfile
      }

      setProfile(p)
      setLoading(false)
    }

    load()
  }, [supabase, router])

  return (
    <AppShell title="내 정보" subtitle="GSW 포털 계정 정보와 동일하게 표시됩니다.">
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">불러오는 중…</p>
      ) : profile ? (
        <AccountInfoView
          profile={profile}
          sessionEmail={sessionEmail}
          lastSignIn={lastSignIn}
          createdAt={createdAt}
          gswPortalUrl={process.env.NEXT_PUBLIC_GSW_PORTAL_URL}
        />
      ) : (
        <p className="text-sm text-red-600">프로필을 불러올 수 없습니다.</p>
      )}
    </AppShell>
  )
}
