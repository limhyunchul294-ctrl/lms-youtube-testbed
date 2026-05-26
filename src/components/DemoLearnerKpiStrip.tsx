'use client'

import { isDemoMode, kpiMet, learnerDemoKpi } from '@/lib/demo-kpi'

export default function DemoLearnerKpiStrip() {
  if (!isDemoMode()) return null

  return (
    <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50/90 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-sky-900">나의 학습 KPI (데모 가정)</h2>
        <span className="text-[10px] font-medium text-sky-800 bg-white/80 px-2 py-0.5 rounded border border-sky-200">
          {learnerDemoKpi.periodLabel}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {learnerDemoKpi.items.map((row) => {
          if ('achievedPct' in row) {
            const met = kpiMet(row.achievedPct, row.targetPct)
            return (
              <div key={row.id} className="rounded-lg bg-white border border-sky-100 p-3 text-sm">
                <div className="text-xs text-slate-600">{row.label}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-sky-900">{row.achievedPct}%</span>
                  <span className="text-xs text-slate-400">목표 {row.targetPct}%</span>
                </div>
                <div className={`text-[11px] font-semibold mt-1 ${met ? 'text-green-700' : 'text-amber-700'}`}>
                  {met ? '✓ 목표 달성' : '진행 중 (데모)'}
                </div>
              </div>
            )
          }
          const met = kpiMet(row.achieved, row.target)
          return (
            <div key={row.id} className="rounded-lg bg-white border border-sky-100 p-3 text-sm">
              <div className="text-xs text-slate-600">{row.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-sky-900">
                  {row.achieved}
                  {row.unit}
                </span>
                <span className="text-xs text-slate-400">목표 {row.target}{row.unit}</span>
              </div>
              <div className={`text-[11px] font-semibold mt-1 ${met ? 'text-green-700' : 'text-amber-700'}`}>
                {met ? '✓ 목표 달성' : '진행 중 (데모)'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
