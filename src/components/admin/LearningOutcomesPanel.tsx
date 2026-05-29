'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { LearningOutcomeRow } from '@/lib/types'

export default function LearningOutcomesPanel() {
  const supabase = createClient()
  const [rows, setRows] = useState<LearningOutcomeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error: rpcError } = await supabase.rpc('get_learning_outcomes')
      if (rpcError) {
        setError(rpcError.message)
      } else {
        setRows((data || []) as LearningOutcomeRow[])
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  if (loading) {
    return (
      <p className="text-sm text-slate-500 py-4">학습 성과 지표를 불러오는 중…</p>
    )
  }

  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        학습 성과 조회 실패: {error}
        <p className="text-xs mt-1 text-amber-800">
          Supabase에 <code className="text-[10px]">20250529100000_learning_outcomes.sql</code> 마이그레이션을
          적용했는지 확인하세요.
        </p>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-slate-500 mb-6">수강·시험 데이터가 없어 성과 지표를 표시할 수 없습니다.</p>
    )
  }

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-slate-900 mb-1">학습 성과 (코스별)</h2>
      <p className="text-xs text-slate-500 mb-3">
        완주율(레슨+필수 활동), 시험 합격률·평균 점수, 재응시(2회 이상 제출) 기준
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-3 py-2.5 font-medium">코스</th>
              <th className="px-3 py-2.5 font-medium">수강</th>
              <th className="px-3 py-2.5 font-medium">완주율</th>
              <th className="px-3 py-2.5 font-medium">시험 응시</th>
              <th className="px-3 py-2.5 font-medium">합격률</th>
              <th className="px-3 py-2.5 font-medium">평균 점수</th>
              <th className="px-3 py-2.5 font-medium">재응시</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.course_id} className="border-b border-slate-50 last:border-0">
                <td className="px-3 py-2.5 font-medium text-slate-900">{row.course_title}</td>
                <td className="px-3 py-2.5 text-slate-600">{row.enrolled_count}</td>
                <td className="px-3 py-2.5">
                  <span className="font-semibold text-blue-700">{row.completion_rate ?? 0}%</span>
                  <span className="text-xs text-slate-400 ml-1">
                    ({row.course_complete_count}/{row.enrolled_count})
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{row.exam_submit_count}</td>
                <td className="px-3 py-2.5 font-semibold text-green-700">{row.exam_pass_rate ?? 0}%</td>
                <td className="px-3 py-2.5 text-slate-600">{row.exam_avg_score ?? 0}점</td>
                <td className="px-3 py-2.5 text-amber-700">{row.exam_retry_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
