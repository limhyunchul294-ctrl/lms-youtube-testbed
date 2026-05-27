'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCompletePage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/dashboard')
      } else {
        router.replace('/')
      }
    })
  }, [router])

  return (
    <div className="min-h-dvh flex items-center justify-center text-sm text-slate-500">
      로그인 완료 처리 중…
    </div>
  )
}
