/** 레슨·슬라이드 완료 인정 비율 (GSW/Moodle 관행: 90%) */
export const LMS_COMPLETION_RATIO = 0.9

export const LMS_COMPLETION_PERCENT = Math.round(LMS_COMPLETION_RATIO * 100)

/** 코스 학습 단계 순서 */
export const LEARNING_PHASE_ORDER = ['guide', 'lessons', 'evaluation', 'exam'] as const

export const PHASE_LABELS: Record<(typeof LEARNING_PHASE_ORDER)[number], string> = {
  guide: '강의 안내 · 수강 규정',
  lessons: '영상 수강',
  evaluation: '강의 만족도 평가',
  exam: '온라인 시험',
}

export function isLessonCompleteByRatio(completedRatio: number): boolean {
  return completedRatio >= LMS_COMPLETION_RATIO
}
