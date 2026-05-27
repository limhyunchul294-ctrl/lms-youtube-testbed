/** EVKMC 코스별 학습 활동(안내·평가·시험) 시드 데이터 */

const GUIDE_SECTIONS = [
  {
    title: '교육 목적',
    body: '친환경차 및 고전압 시스템에 대한 기본 이해와 안전 수칙을 습득하는 것이 목표입니다.',
  },
  {
    title: '수강 방법',
    body: '각 강의 영상을 순서대로 수강하세요. 영상의 90% 이상 시청 시 해당 강이 완료 처리됩니다. LMS 페이지에서 시청해야 진도가 기록됩니다.',
  },
  {
    title: '평가·시험',
    body: '전 강의 수강 완료 후 만족도 평가를 제출하고, 온라인 시험에 응시합니다. 시험 합격 시 코스 수료로 표시됩니다.',
  },
]

const EVAL_QUESTIONS = [
  { id: 'overall', label: '전체 강의 만족도', type: 'rating' as const, max: 5 },
  { id: 'content', label: '내용 이해도', type: 'rating' as const, max: 5 },
  { id: 'comment', label: '개선 의견 (선택)', type: 'text' as const, optional: true },
]

const EXAM_QUESTIONS = [
  {
    id: 'q1',
    label: '고전압 배터리 작업 시 가장 먼저 해야 할 것은?',
    options: ['장갑만 착용', '전원 차단·잔류전압 확인', '즉시 분해', '일반 승용차와 동일 시행'],
    correct: 1,
  },
  {
    id: 'q2',
    label: '친환경차(EV)의 동력 전달 방식에 가장 가까운 설명은?',
    options: [
      '엔진만으로 구동',
      '모터·인버터·배터리로 구동',
      '변속기만으로 구동',
      '연료탱크 압력으로 구동',
    ],
    correct: 1,
  },
  {
    id: 'q3',
    label: 'LMS에서 강의 완료로 인정되는 시청 비율은?',
    options: ['50%', '70%', '90%', '100% 필수'],
    correct: 2,
  },
]

import { EVKMC_COURSE_IDS } from '@/lib/evkmc'

export { EVKMC_COURSE_IDS }

// Supabase course_activities.id / activity_submissions.activity_id는 uuid 타입입니다.
// 따라서 seed용 activity id는 실제 uuid 형식으로 고정값을 사용합니다.
const EVKMC_ACTIVITY_IDS = {
  eco: {
    guide: '33333333-a001-4000-8000-000000000001',
    evaluation: '33333333-a001-4000-8000-000000000002',
    exam: '33333333-a001-4000-8000-000000000003',
  },
  hv: {
    guide: '33333333-a002-4000-8000-000000000004',
    evaluation: '33333333-a002-4000-8000-000000000005',
    exam: '33333333-a002-4000-8000-000000000006',
  },
} as const

export function buildEvkmcActivityRows() {
  const base = (
    courseId: string,
    ids: { guide: string; evaluation: string; exam: string }
  ): Array<{
    id: string
    course_id: string
    activity_type: 'guide' | 'evaluation' | 'exam'
    title: string
    description: string
    config: Record<string, unknown>
    sort_order: number
    is_required: boolean
  }> => [
    {
      id: ids.guide,
      course_id: courseId,
      activity_type: 'guide' as const,
      title: '강의 안내 및 수강 규정',
      description: '수강 전 반드시 확인해 주세요.',
      config: { sections: GUIDE_SECTIONS },
      sort_order: 0,
      is_required: true,
    },
    {
      id: ids.evaluation,
      course_id: courseId,
      activity_type: 'evaluation' as const,
      title: '강의 만족도 평가',
      description: '전 강의 수강 완료 후 제출해 주세요.',
      config: { questions: EVAL_QUESTIONS },
      sort_order: 100,
      is_required: true,
    },
    {
      id: ids.exam,
      course_id: courseId,
      activity_type: 'exam' as const,
      title: '온라인 이수 시험',
      description: '평가 제출 후 응시할 수 있습니다.',
      config: { pass_score: 70, questions: EXAM_QUESTIONS },
      sort_order: 101,
      is_required: true,
    },
  ]

  return [
    ...base(EVKMC_COURSE_IDS.eco, EVKMC_ACTIVITY_IDS.eco),
    ...base(EVKMC_COURSE_IDS.hv, EVKMC_ACTIVITY_IDS.hv),
  ]
}
