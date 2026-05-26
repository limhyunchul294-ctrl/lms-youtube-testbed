/**
 * A안: 데모 모드 — 실제 DB와 별개로, KPI 목표 달성 가정치를 화면에만 표시합니다.
 * NEXT_PUBLIC_DEMO_MODE=true 일 때 활성화됩니다.
 */

export function isDemoMode(): boolean {
  const v = process.env.NEXT_PUBLIC_DEMO_MODE
  return v === 'true' || v === '1'
}

/** 운영 KPI (관리자용): 목표치 대비 달성 가정 */
export const adminDemoKpi = {
  periodLabel: '이번 분기 (데모 가정)',
  items: [
    {
      id: 'avg_completion',
      label: '평균 과정 완료율',
      unit: '%',
      target: 60,
      achieved: 78,
      note: '전 수강생·전 과정 기준',
    },
    {
      id: 'active_30d',
      label: '30일 활성 수강생 비율',
      unit: '%',
      target: 45,
      achieved: 52,
      note: '최소 1회 학습 세션',
    },
    {
      id: 'retention_7d',
      label: '7일 재방문율',
      unit: '%',
      target: 35,
      achieved: 41,
      note: '주간 복귀',
    },
    {
      id: 'nps',
      label: '만족도 (NPS)',
      unit: '점',
      target: 40,
      achieved: 52,
      note: '설문 가정',
    },
  ],
} as const

/** 수강생 대시보드용 KPI (개인 학습 가정) */
export const learnerDemoKpi = {
  periodLabel: '이번 달 (데모 가정)',
  items: [
    {
      id: 'monthly_progress',
      label: '목표 대비 학습 진도',
      targetPct: 70,
      achievedPct: 88,
    },
    {
      id: 'weekly_sessions',
      label: '주간 학습 세션',
      target: 3,
      achieved: 4,
      unit: '회',
    },
  ],
} as const

export function kpiMet(achieved: number, target: number): boolean {
  return achieved >= target
}
