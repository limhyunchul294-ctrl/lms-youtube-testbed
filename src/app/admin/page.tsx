'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import type { AdminProgress } from '@/lib/types'

export default function AdminPage() {
  const [data, setData] = useState<AdminProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // 관리자 체크
      if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        router.push('/dashboard')
        return
      }

      // 전체 진도 데이터 조회 (DB 함수)
      const { data: progressData, error } = await supabase.rpc('get_all_progress')

      if (error) {
        console.error('Admin query error:', error)
      }

      setData(progressData || [])
      setLoading(false)
    }
    init()
  }, [])

  // 검색 필터
  const filtered = data.filter(
    (d) =>
      d.user_email.toLowerCase().includes(search.toLowerCase()) ||
      d.course_title.toLowerCase().includes(search.toLowerCase())
  )

  // 통계
  const totalStudents = new Set(data.map((d) => d.user_email)).size
  const avgProgress = data.length > 0
    ? Math.round(data.reduce((sum, d) => sum + (d.progress_pct || 0), 0) / data.length)
    : 0
  const completedCount = data.filter((d) => d.progress_pct === 100).length

  // 진도율 색상
  const pctColor = (pct: number) => {
    if (pct === 100) return 'text-green-700 bg-green-50'
    if (pct >= 50) return 'text-blue-700 bg-blue-50'
    if (pct > 0) return 'text-amber-700 bg-amber-50'
    return 'text-slate-500 bg-slate-50'
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">수강 관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">수강생별 강의 진도 현황을 확인합니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
            <div className="text-xs text-slate-500 mt-0.5">수강생</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{avgProgress}%</div>
            <div className="text-xs text-slate-500 mt-0.5">평균 진도율</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-slate-500 mt-0.5">수료 완료</div>
          </div>
        </div>

        {/* 검색 + 동기화 */}
        <div className="mb-4 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="이메일 또는 강의명으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 md:max-w-xs px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          />
          <button
            onClick={async () => {
              setSyncing(true)
              setSyncResult(null)
              try {
                const res = await fetch('/api/sync/airtable', {
                  method: 'POST',
                  headers: { 'x-sync-key': process.env.NEXT_PUBLIC_SYNC_API_KEY || '' },
                })
                const result = await res.json()
                if (result.success) {
                  setSyncResult(`Airtable 동기화 완료: ${result.logs?.join(', ')}`)
                } else {
                  setSyncResult(`오류: ${result.error}`)
                }
              } catch (e: any) {
                setSyncResult(`연결 실패: ${e.message}`)
              }
              setSyncing(false)
            }}
            disabled={syncing}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50 whitespace-nowrap"
          >
            {syncing ? '동기화 중...' : '📊 Airtable 동기화'}
          </button>
        </div>
        {syncResult && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-xs ${syncResult.includes('완료') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {syncResult}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-slate-500 text-sm">수강 데이터가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* PC: 테이블 */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">수강생</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">강의</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500">완료/전체</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500">진도율</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 w-40">진행 바</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-700">{row.user_email}</td>
                      <td className="px-4 py-3 text-slate-600">{row.course_title}</td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {row.completed_lessons}/{row.total_lessons}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${pctColor(row.progress_pct || 0)}`}>
                          {row.progress_pct ?? 0}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${(row.progress_pct || 0) === 100 ? 'complete' : ''}`}
                            style={{ width: `${row.progress_pct ?? 0}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일: 카드 */}
            <div className="md:hidden space-y-2">
              {filtered.map((row, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{row.user_email}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{row.course_title}</div>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${pctColor(row.progress_pct || 0)}`}>
                      {row.progress_pct ?? 0}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${(row.progress_pct || 0) === 100 ? 'complete' : ''}`}
                      style={{ width: `${row.progress_pct ?? 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5">
                    {row.completed_lessons}/{row.total_lessons} 강의 완료
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}
