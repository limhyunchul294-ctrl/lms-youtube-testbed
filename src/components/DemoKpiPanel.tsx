'use client'

import { adminDemoKpi, isDemoMode, kpiMet } from '@/lib/demo-kpi'

export default function DemoKpiPanel() {
  if (!isDemoMode()) return null

  return (
    <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-amber-900">운영 KPI (데모 가정)</h2>
          <p className="text-xs text-amber-800/90 mt-0.5">{adminDemoKpi.periodLabel}</p>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide text-amber-800 bg-amber-100/90 px-2 py-1 rounded-md border border-amber-200">
          목표 달성 가정
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {adminDemoKpi.items.map((row) => {
          const met = kpiMet(row.achieved, row.target)
          return (
            <div
              key={row.id}
              className="rounded-lg bg-white border border-amber-100 p-3 shadow-sm"
            >
              <div className="text-xs font-medium text-slate-700">{row.label}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-900">
                  {row.achieved}
                  {row.unit}
                </span>
                <span className="text-xs text-slate-400">/ 목표 {row.target}{row.unit}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className={`text-[11px] font-semibold ${met ? 'text-green-700' : 'text-amber-700'}`}>
                  {met ? '✓ 목표 달성' : '목표 미달 (데모)'}
                </span>
              </div>
              {row.note && (
                <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">{row.note}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
