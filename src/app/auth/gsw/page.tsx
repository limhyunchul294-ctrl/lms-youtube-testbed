'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function GswBridgeInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [message, setMessage] = useState('GSW 계정으로 LMS에 연결하는 중입니다…')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('연동 토큰이 없습니다. GSW 포털에서 다시 «교육 센터»를 선택해 주세요.')
      return
    }

    const run = async () => {
      const res = await fetch('/api/auth/gsw-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || '연동에 실패했습니다.')
        return
      }
      router.replace(data.redirect || '/dashboard')
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
