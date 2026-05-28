'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PageWatermark from '@/components/layout/PageWatermark'
import type { LearnerProfile } from '@/lib/profile'
import { profileFromUserMetadata, syncProfileFromAuthUser } from '@/lib/profile'

const NAV = [
  { href: '/dashboard', label: '내 학습', icon: '📚' },
  { href: '/courses', label: '강의 탐색', icon: '🔍' },
]

function ProfileCard({ profile, compact }: { profile: LearnerProfile | null; compact?: boolean }) {
  if (!profile) return null
  const lines: { label: string; value: string }[] = []
  if (profile.gsw_user_id) lines.push({ label: 'GSW', value: profile.gsw_user_id })
  if (profile.employee_no) lines.push({ label: '사번', value: profile.employee_no })
  if (profile.department) lines.push({ label: '부서', value: profile.department })
  if (profile.position) lines.push({ label: '직급', value: profile.position })
  if (profile.company) lines.push({ label: '소속', value: profile.company })

  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
      <p className={`font-medium text-[var(--text)] truncate ${compact ? 'text-xs' : 'text-sm'}`}>
        {profile.display_name || profile.email}
      </p>
      {lines.map((l) => (
        <p key={l.label} className="text-[10px] text-[var(--text-muted)] truncate">
          <span className="text-slate-400">{l.label}</span> {l.value}
        </p>
      ))}
      {!profile.gsw_user_id && (
        <p className="text-[10px] text-amber-700">GSW 연동 정보 없음</p>
      )}
    </div>
  )
}

function NavLinks({
  pathname,
  isAdmin,
  onNavigate,
}: {
  pathname: string
  isAdmin: boolean
  onNavigate?: () => void
}) {
  return (
    <>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium transition touch-manipulation min-h-[44px] ${
              active
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:bg-slate-50 hover:text-[var(--text)]'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
      {isAdmin && (
        <>
          <Link
            href="/admin"
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium transition touch-manipulation min-h-[44px] ${
              pathname === '/admin'
                ? 'bg-amber-50 text-amber-800'
                : 'text-[var(--text-muted)] hover:bg-slate-50'
            }`}
          >
            <span>⚙️</span>
            수강 관리
          </Link>
          <Link
            href="/admin/activities"
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium transition touch-manipulation min-h-[44px] ${
              pathname.startsWith('/admin/activities')
                ? 'bg-amber-50 text-amber-800'
                : 'text-[var(--text-muted)] hover:bg-slate-50'
            }`}
          >
            <span>📝</span>
            활동·시험
          </Link>
        </>
      )}
    </>
  )
}

export default function AppShell({
  children,
  title,
  subtitle,
  showWatermark = true,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showWatermark?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<LearnerProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setIsAdmin(user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL)

      let row = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      let p = row.data as LearnerProfile | null

      if (!p?.gsw_user_id && user.user_metadata?.gsw_user_id) {
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
    })
  }, [supabase])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const displayName = profile?.display_name || '학습자'

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-[var(--bg)]">
      <aside className="hidden md:flex md:w-60 lg:w-64 flex-col border-r border-[var(--border)] bg-[var(--card)] shrink-0">
        <div className="p-5 border-b border-[var(--border)]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-lg">
              E
            </span>
            <div>
              <p className="font-bold text-[var(--text)] text-sm leading-tight">EVKMC 교육</p>
              <p className="text-[10px] text-[var(--text-muted)]">LMS 학습센터</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavLinks pathname={pathname} isAdmin={isAdmin} />
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <ProfileCard profile={profile} />
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] touch-manipulation"
          >
            로그아웃
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur px-3 py-2.5 flex items-center gap-2">
          <button
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setMenuOpen(true)}
            className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg border border-[var(--border)] text-lg touch-manipulation"
          >
            ☰
          </button>
          <Link href="/dashboard" className="font-bold text-sm text-[var(--text)] truncate flex-1">
            EVKMC 교육
          </Link>
          <span className="text-xs text-[var(--text-muted)] truncate max-w-[28%]">{displayName}</span>
        </header>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="메뉴 닫기"
              className="md:hidden fixed inset-0 z-40 bg-black/40"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] flex flex-col bg-[var(--card)] shadow-xl">
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                <p className="font-bold text-sm">메뉴</p>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="h-9 w-9 rounded-lg border border-[var(--border)] touch-manipulation"
                >
                  ✕
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                <NavLinks pathname={pathname} isAdmin={isAdmin} onNavigate={() => setMenuOpen(false)} />
              </nav>
              <div className="p-4 border-t border-[var(--border)]">
                <ProfileCard profile={profile} compact />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 w-full py-2.5 text-sm rounded-lg border border-[var(--border)] touch-manipulation"
                >
                  로그아웃
                </button>
              </div>
            </aside>
          </>
        )}

        <main className="relative flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 md:px-8 py-5 md:py-8 overflow-hidden main-with-mobile-nav">
          {showWatermark && <PageWatermark />}
          <div className="relative z-[1] min-h-0">
            {(title || subtitle) && (
              <header className="mb-5 md:mb-8">
                {title && (
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text)] leading-snug">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
                )}
              </header>
            )}
            {children}
          </div>
        </main>

        <nav className="md:hidden mobile-nav border-t border-[var(--border)] bg-[var(--card)]">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] text-[10px] touch-manipulation ${
                  active ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/admin/activities"
              className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] text-[10px] touch-manipulation ${
                pathname.startsWith('/admin')
                  ? 'text-amber-800 font-semibold'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <span className="text-lg leading-none">📝</span>
              관리
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}
