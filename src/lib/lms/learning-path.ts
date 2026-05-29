import { LMS_COMPLETION_PERCENT, PHASE_LABELS } from '@/lib/lms/rules'
import type {
  ActivityAccessResult,
  CourseActivity,
  LearningPathContext,
  LearningStep,
  NextAction,
} from '@/lib/lms/types'

function findActivity(activities: CourseActivity[], type: CourseActivity['activity_type']) {
  return activities.find((a) => a.activity_type === type)
}

export function buildLearningSteps(ctx: LearningPathContext): LearningStep[] {
  const { enrolled, activities, completedActivityIds, lessons, lessonHref, activityHref } = ctx

  const guide = findActivity(activities, 'guide')
  const evaluation = findActivity(activities, 'evaluation')
  const exam = findActivity(activities, 'exam')

  const guideDone = guide ? completedActivityIds.has(guide.id) : true
  const totalCount = lessons.length
  const completedCount = lessons.filter((l) => l.is_completed).length
  const lessonsDone = totalCount > 0 && completedCount >= totalCount
  const evalDone = evaluation ? completedActivityIds.has(evaluation.id) : true
  const examDone = exam ? completedActivityIds.has(exam.id) : true

  const sorted = [...lessons].sort((a, b) => a.sort_order - b.sort_order)
  const firstIncomplete = sorted.find((l) => !l.is_completed)
  const lessonTarget = firstIncomplete ?? sorted[0]
  const lessonTargetHref = lessonTarget ? lessonHref(lessonTarget.lesson_id) : '#'

  return [
    {
      key: 'guide',
      label: PHASE_LABELS.guide,
      href: guide ? activityHref(guide) : '#',
      status: !guide
        ? 'done'
        : guideDone
          ? 'done'
          : enrolled
            ? 'available'
            : 'locked',
      detail: guideDone ? '확인 완료' : '수강 전 필독',
    },
    {
      key: 'lessons',
      label: PHASE_LABELS.lessons,
      href: lessonTargetHref,
      status: !enrolled
        ? 'locked'
        : lessonsDone
          ? 'done'
          : guideDone || !guide
            ? completedCount > 0
              ? 'in_progress'
              : 'available'
            : 'locked',
      detail: `${completedCount}/${totalCount} 강 완료`,
    },
    {
      key: 'evaluation',
      label: PHASE_LABELS.evaluation,
      href: evaluation ? activityHref(evaluation) : '#',
      status: !evaluation
        ? 'done'
        : evalDone
          ? 'done'
          : lessonsDone
            ? 'available'
            : 'locked',
      detail: evalDone ? '제출 완료' : '전 강의 수강 후 진행',
    },
    {
      key: 'exam',
      label: PHASE_LABELS.exam,
      href: exam ? activityHref(exam) : '#',
      status: !exam
        ? 'done'
        : examDone
          ? 'done'
          : evalDone || !evaluation
            ? lessonsDone
              ? 'available'
              : 'locked'
            : 'locked',
      detail: examDone ? '합격' : `합격 기준 ${Number(exam?.config?.pass_score ?? 70)}점`,
    },
  ]
}

export function resolveNextStep(steps: LearningStep[]): LearningStep | undefined {
  return steps.find((s) => s.status === 'available' || s.status === 'in_progress')
}

export function stepToNextAction(step: LearningStep): NextAction {
  return {
    title: step.label,
    detail: step.detail,
    href: step.href !== '#' ? step.href : undefined,
    ctaLabel: step.status === 'in_progress' ? '이어하기' : '시작하기',
  }
}

export function computeLessonProgressPercent(completed: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((completed / total) * 100)
}

export function checkActivityAccess(
  activity: CourseActivity,
  opts: {
    guideAcknowledged: boolean
    lessonsComplete: boolean
    evaluationPassed: boolean
    hubHref: string
  }
): ActivityAccessResult {
  const { guideAcknowledged, lessonsComplete, evaluationPassed, hubHref } = opts

  if (activity.activity_type === 'guide') {
    return { allowed: true }
  }
  if (activity.activity_type === 'evaluation') {
    if (guideAcknowledged && lessonsComplete) return { allowed: true }
    return {
      allowed: false,
      message:
        '먼저 강의 안내를 확인하고, 영상 수강을 모두 완료한 후에 만족도 평가를 제출할 수 있습니다.',
      hubHref,
    }
  }
  if (activity.activity_type === 'exam') {
    if (guideAcknowledged && lessonsComplete && evaluationPassed) {
      return { allowed: true }
    }
    return {
      allowed: false,
      message:
        '평가를 완료하고(합격 기준 충족) 영상 수강을 모두 완료한 후에 시험을 제출할 수 있습니다.',
      hubHref,
    }
  }
  return { allowed: false, message: '이 활동은 아직 이용할 수 없습니다.', hubHref }
}

export function resolveActivityNextAction(
  activityType: CourseActivity['activity_type'],
  opts: { passed: boolean; hubHref: string }
): NextAction {
  const titles: Record<CourseActivity['activity_type'], string> = {
    guide: '강의 안내를 확인한 뒤 영상 학습으로 이동해 주세요.',
    evaluation: '평가 제출 후 온라인 시험 단계로 이동합니다.',
    exam: '시험 완료 후 수료증 발급 여부를 확인해 주세요.',
  }
  return {
    title: titles[activityType],
    detail: opts.passed
      ? '현재 단계가 완료되었습니다. 다음 단계로 이동하세요.'
      : '제출 전 필수 항목을 확인해 주세요.',
    href: opts.passed ? opts.hubHref : undefined,
    ctaLabel: '강의 허브',
  }
}

export function resolveLessonNextAction(opts: {
  completed: boolean
  nextLessonHref: string | null
  hubHref: string
}): NextAction {
  if (!opts.completed) {
    return {
      title: `현재 강의를 ${LMS_COMPLETION_PERCENT}% 이상 수강해 주세요.`,
      detail: '완료 처리되면 다음 강의 버튼이 강조됩니다.',
    }
  }
  return {
    title: '강의가 완료되었습니다.',
    detail: opts.nextLessonHref
      ? '다음 강의로 이동해 학습을 이어가세요.'
      : '코스 허브에서 평가/시험 단계로 이동하세요.',
    href: opts.nextLessonHref || opts.hubHref,
    ctaLabel: opts.nextLessonHref ? '다음 강의' : '강의 허브',
  }
}
