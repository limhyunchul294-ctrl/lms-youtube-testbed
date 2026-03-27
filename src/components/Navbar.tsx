'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const e = data.user?.email ?? null
      setEmail(e)
      setIsAdmin(e === process.env.NEXT_PUBLIC_ADMIN_EMAIL)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navItems = [
    { href: '/dashboard', label: '내 강의', icon: '📚' },
    { href: '/courses', label: '전체 강의', icon: '🎓' },
    ...(isAdmin ? [{ href: '/admin', label: '관리', icon: '⚙️' }] : []),
  ]

  return (
    <>
      {/* PC 상단 네비 */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold text-slate-900 tracking-tight">
            📖 LMS
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {email && (
              <div className="ml-4 flex items-center gap-3">
                <span className="text-xs text-slate-400">{email}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 모바일 하단 탭 네비 */}
      <nav className="mobile-nav md:hidden flex justify-around items-center">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg text-xs font-medium transition-colors ${
              pathname === item.href
                ? 'text-blue-600'
                : 'text-slate-400'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        {email && (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 px-4 py-1 text-xs text-slate-400"
          >
            <span className="text-lg">👋</span>
            <span>로그아웃</span>
          </button>
        )}
      </nav>
    </>
  )
}
