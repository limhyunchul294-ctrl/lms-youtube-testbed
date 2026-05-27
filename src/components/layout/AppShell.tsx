'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/dashboard', label: '내 학습', icon: '📚' },
  { href: '/courses', label: '강의 탐색', icon: '🔍' },
]

export default function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [displayName, setDisplayName] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setIsAdmin(user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL)
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle()
      setDisplayName(profile?.display_name || user.email?.split('@')[0] || '학습자')
    })
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-[var(--bg)]">
      <aside className="hidden md:flex md:w-60 lg:w-64 flex-col border-r border-[var(--border)] bg-[var(--card)]">
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
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
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
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
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
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
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
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text)] truncate">{displayName}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent)]"
          >
            로그아웃
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-sm text-[var(--text)]">
            EVKMC 교육
          </Link>
          <button type="button" onClick={handleLogout} className="text-xs text-[var(--text-muted)]">
            로그아웃
          </button>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-6 md:py-8">
          {(title || subtitle) && (
            <header className="mb-6 md:mb-8">
              {title && <h1 className="text-xl md:text-2xl font-bold text-[var(--text)]">{title}</h1>}
              {subtitle && (
                <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
              )}
            </header>
          )}
          {children}
        </main>

        <nav className="md:hidden mobile-nav border-t border-[var(--border)] bg-[var(--card)]">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${
                  active ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
