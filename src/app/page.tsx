'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

const gswOnly = process.env.NEXT_PUBLIC_GSW_BRIDGE_ONLY === 'true'
const portalUrl = process.env.NEXT_PUBLIC_GSW_PORTAL_URL

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      setMessage(error ? error.message : '가입 완료! 이메일을 확인해 주세요.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push(next)
    }
    setLoading(false)
  }

  const handleGswDev = async () => {
    setLoading(true)
    const res = await fetch('/api/auth/gsw-bridge')
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error || 'GSW 데모 연동 실패')
      setLoading(false)
      return
    }
    router.push(data.bridge_url)
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      <section className="lg:w-1/2 bg-[var(--accent)] text-white px-8 py-12 flex flex-col justify-center">
        <p className="text-sm font-medium opacity-90">EVKMC 사내교육</p>
        <h1 className="text-3xl lg:text-4xl font-bold mt-2 leading-tight">
          친환경차·고전압
          <br />
          통합 학습센터
        </h1>
        <p className="mt-4 text-sm opacity-90 max-w-md leading-relaxed">
          GSW 포털 계정으로 접속하고, 강의 안내 → 영상 수강 → 만족도 평가 → 온라인 시험까지 한
          곳에서 완료하세요.
        </p>
        <ul className="mt-8 space-y-2 text-sm opacity-95">
          <li>✓ 수강 진도·완료 자동 기록</li>
          <li>✓ 코스별 학습 로드맵</li>
          <li>✓ 평가·시험 연동 (EVKMC 7강)</li>
        </ul>
      </section>

      <section className="lg:w-1/2 flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
        <div className="w-full max-w-sm">
          {gswOnly ? (
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[var(--text)]">GSW 포털 로그인</h2>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                LMS는 GSW(기술문서 포털) 계정으로만 접속할 수 있습니다.
              </p>
              <a
                href={portalUrl || '#'}
                className="mt-6 block w-full py-2.5 text-center rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90"
              >
                GSW 포털에서 로그인
              </a>
              {process.env.NEXT_PUBLIC_GSW_BRIDGE_ALLOW_DEV === 'true' && (
                <button
                  type="button"
                  onClick={handleGswDev}
                  disabled={loading}
                  className="mt-3 w-full py-2 text-xs text-[var(--text-muted)] border border-[var(--border)] rounded-lg"
                >
                  개발용 GSW 연동 테스트
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[var(--text)] mb-1">LMS 로그인</h2>
              <p className="text-xs text-[var(--text-muted)] mb-6">
                GSW 연동 시 포털의 «교육 센터» 메뉴를 이용하세요.
              </p>

              {portalUrl && (
                <a
                  href={portalUrl}
                  className="mb-4 block w-full py-2.5 text-center rounded-lg border-2 border-[var(--accent)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent-soft)]"
                >
                  GSW 포털로 이동
                </a>
              )}

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[var(--card)] px-2 text-[var(--text-muted)]">
                    또는 이메일 로그인
                  </span>
                </div>
              </div>

              <div className="flex bg-slate-100 rounded-lg p-0.5 mb-4">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md ${
                    mode === 'login' ? 'bg-white shadow-sm' : 'text-[var(--text-muted)]'
                  }`}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md ${
                    mode === 'signup' ? 'bg-white shadow-sm' : 'text-[var(--text-muted)]'
                  }`}
                >
                  회원가입
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">비밀번호</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}
                </button>
              </form>

              {process.env.NEXT_PUBLIC_GSW_BRIDGE_ALLOW_DEV === 'true' && (
                <button
                  type="button"
                  onClick={handleGswDev}
                  disabled={loading}
                  className="mt-3 w-full py-2 text-xs text-[var(--text-muted)]"
                >
                  GSW 브릿지 데모 (student1)
                </button>
              )}

              {message && (
                <p
                  className={`mt-3 text-xs text-center ${
                    message.includes('완료') ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center">…</div>}>
      <LoginForm />
    </Suspense>
  )
}
