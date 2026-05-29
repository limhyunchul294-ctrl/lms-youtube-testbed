import type { ActivityType, CourseActivity, CourseLearningStatus } from '@/lib/types'

/** Open edX / Frappe 스타일 4단계 학습 경로 (코스당 고정) */
export type LearningPhaseKey = 'guide' | 'lessons' | 'evaluation' | 'exam'

export type StepStatus = 'locked' | 'available' | 'in_progress' | 'done'

export type LearningStep = {
  key: LearningPhaseKey
  label: string
  href: string
  status: StepStatus
  detail?: string
}

export type NextAction = {
  title: string
  detail?: string
  href?: string
  ctaLabel?: string
}

export type ActivityAccessResult =
  | { allowed: true }
  | { allowed: false; message: string; hubHref: string }

export type LessonProgressSlice = {
  lesson_id: string
  is_completed: boolean
  sort_order: number
}

export type LearningPathContext = {
  enrolled: boolean
  activities: CourseActivity[]
  completedActivityIds: Set<string>
  lessons: LessonProgressSlice[]
  lessonHref: (lessonId: string) => string
  activityHref: (activity: CourseActivity) => string
  status?: CourseLearningStatus | null
}

export type { ActivityType, CourseActivity, CourseLearningStatus }
