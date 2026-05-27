/** EVKMC 운영 코스·데모 코스 구분 */

export const EVKMC_COURSE_IDS = {
  eco: '33333333-1111-1111-1111-111111111111',
  hv: '33333333-2222-2222-2222-222222222222',
} as const

export const EVKMC_COURSE_ID_LIST = Object.values(EVKMC_COURSE_IDS)

export const DEMO_COURSE_IDS = [
  '11111111-1111-1111-1111-111111111111',
  '11111111-2222-2222-2222-222222222222',
] as const

export function isDemoCourseId(courseId: string): boolean {
  return DEMO_COURSE_IDS.includes(courseId as (typeof DEMO_COURSE_IDS)[number])
}

export function isEvkmcCourseId(courseId: string): boolean {
  return EVKMC_COURSE_ID_LIST.includes(courseId as (typeof EVKMC_COURSE_ID_LIST)[number])
}

export const EVKMC_EXAM_ACTIVITY_IDS = {
  eco: '33333333-a001-4000-8000-000000000003',
  hv: '33333333-a002-4000-8000-000000000006',
} as const
