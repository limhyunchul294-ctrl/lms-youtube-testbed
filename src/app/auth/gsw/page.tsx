'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { syncProfileFromAuthUser } from '@/lib/profile'

function GswBridgeInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [message, setMessage] = useState('GSW 계정으로 LMS에 연결하는 중입니다…')
  const requestedRef = useRef(false)

  useEffect(() => {
    if (requestedRef.current) return
    requestedRef.current = true

    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('연동 토큰이 없습니다. GSW 포털에서 다시 «교육 센터»를 선택해 주세요.')
      return
    }

    const run = async () => {
      const supabase = createClient()

      // 이전 이메일 로그인(student1 등) 세션이 남아 있으면 브릿지 실패 시 그대로 대시보드로 가는 문제 방지
      await supabase.auth.signOut()

      const res = await fetch('/api/auth/gsw-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || '연동에 실패했습니다. GSW 포털에서 다시 시도해 주세요.')
        return
      }

      const email = typeof data.email === 'string' ? data.email : ''
      const tokenHash = typeof data.token_hash === 'string' ? data.token_hash : ''

      if (tokenHash) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email',
        })
        if (!otpError) {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) await syncProfileFromAuthUser(supabase, user)
          router.replace('/dashboard')
          return
        }
        console.warn('GSW bridge verifyOtp failed, trying redirect fallback', otpError.message)
      }

      const redirect = String(data.redirect || '')
      if (redirect.startsWith('http')) {
        window.location.assign(redirect)
        return
      }

      setStatus('error')
      setMessage(
        email
          ? `${email} 계정으로 세션을 만들지 못했습니다. 잠시 후 GSW에서 다시 «교육 센터»를 눌러 주세요.`
          : '세션 연동에 실패했습니다.'
      )
    }

    run()
  }, [searchParams, router])

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-[var(--bg)]">
      <div className="max-w-md w-full text-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        {status === 'loading' ? (
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent mb-4" />
        ) : (
          <div className="text-4xl mb-4">⚠️</div>
        )}
        <p className="text-sm text-[var(--text-muted)]">{message}</p>
        {status === 'error' && (
          <a
            href={process.env.NEXT_PUBLIC_GSW_PORTAL_URL || '/'}
            className="mt-6 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            포털로 돌아가기
          </a>
        )}
      </div>
    </div>
  )
}

export default function GswAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-sm text-slate-500">
          연결 중…
        </div>
      }
    >
      <GswBridgeInner />
    </Suspense>
  )
}
