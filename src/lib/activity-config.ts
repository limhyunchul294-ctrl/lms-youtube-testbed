import type { ActivityType } from '@/lib/types'

type GuideSection = { title: string; body: string }
type EvalQuestion = {
  id: string
  label: string
  type: 'rating' | 'text'
  max?: number
  optional?: boolean
}
type ExamQuestion = {
  id: string
  label: string
  options: string[]
  correct: number
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field}는 비어 있을 수 없습니다.`)
  }
  return value.trim()
}

function validateGuideConfig(config: Record<string, unknown>) {
  const sections = config.sections
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error('guide config에는 sections 배열이 1개 이상 필요합니다.')
  }
  const normalized: GuideSection[] = sections.map((s, i) => {
    if (!isRecord(s)) throw new Error(`sections[${i}] 형식이 올바르지 않습니다.`)
    return {
      title: requireString(s.title, `sections[${i}].title`),
      body: requireString(s.body, `sections[${i}].body`),
    }
  })
  return { sections: normalized }
}

function validateEvaluationConfig(config: Record<string, unknown>) {
  const questions = config.questions
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('evaluation config에는 questions 배열이 1개 이상 필요합니다.')
  }
  const normalized: EvalQuestion[] = questions.map((q, i) => {
    if (!isRecord(q)) throw new Error(`questions[${i}] 형식이 올바르지 않습니다.`)
    const type = q.type
    if (type !== 'rating' && type !== 'text') {
      throw new Error(`questions[${i}].type은 rating 또는 text여야 합니다.`)
    }
    const item: EvalQuestion = {
      id: requireString(q.id, `questions[${i}].id`),
      label: requireString(q.label, `questions[${i}].label`),
      type,
    }
    if (type === 'rating') {
      const max = q.max === undefined ? 5 : Number(q.max)
      if (!Number.isFinite(max) || max < 2 || max > 10) {
        throw new Error(`questions[${i}].max는 2~10 사이 숫자여야 합니다.`)
      }
      item.max = Math.round(max)
    }
    if (q.optional === true) item.optional = true
    return item
  })
  return { questions: normalized }
}

function validateExamConfig(config: Record<string, unknown>) {
  const passScoreRaw = config.pass_score === undefined ? 70 : Number(config.pass_score)
  if (!Number.isFinite(passScoreRaw) || passScoreRaw < 0 || passScoreRaw > 100) {
    throw new Error('exam config의 pass_score는 0~100 숫자여야 합니다.')
  }
  const questions = config.questions
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('exam config에는 questions 배열이 1개 이상 필요합니다.')
  }
  const normalized: ExamQuestion[] = questions.map((q, i) => {
    if (!isRecord(q)) throw new Error(`questions[${i}] 형식이 올바르지 않습니다.`)
    const options = q.options
    if (!Array.isArray(options) || options.length < 2) {
      throw new Error(`questions[${i}].options는 2개 이상 필요합니다.`)
    }
    const optionTexts = options.map((opt, oi) => requireString(opt, `questions[${i}].options[${oi}]`))
    const correct = Number(q.correct)
    if (!Number.isInteger(correct) || correct < 0 || correct >= optionTexts.length) {
      throw new Error(`questions[${i}].correct는 0~(옵션수-1) 정수여야 합니다.`)
    }
    return {
      id: requireString(q.id, `questions[${i}].id`),
      label: requireString(q.label, `questions[${i}].label`),
      options: optionTexts,
      correct,
    }
  })
  return { pass_score: Math.round(passScoreRaw), questions: normalized }
}

/** 활동 유형별 config 검증·정규화 */
export function validateActivityConfig(
  activityType: ActivityType,
  config: unknown
): Record<string, unknown> {
  if (!isRecord(config)) {
    throw new Error('config는 JSON 객체여야 합니다.')
  }

  if (activityType === 'guide') return validateGuideConfig(config)
  if (activityType === 'evaluation') return validateEvaluationConfig(config)
  if (activityType === 'exam') return validateExamConfig(config)

  throw new Error('지원하지 않는 activity_type입니다.')
}
