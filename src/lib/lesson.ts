export type LessonType = 'video' | 'slides'

export interface SlideItem {
  image_url: string
  title?: string
  caption?: string
}

export function parseSlides(raw: unknown): SlideItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((s): s is SlideItem => typeof s === 'object' && s !== null && 'image_url' in s)
    .map((s) => ({
      image_url: String((s as SlideItem).image_url),
      title: (s as SlideItem).title,
      caption: (s as SlideItem).caption,
    }))
}

/** 영상 레슨: 시청 위치 기준 진도율(0~100) */
export function videoWatchPercent(watchedSeconds: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0
  return Math.min(Math.round((watchedSeconds / durationSeconds) * 100), 100)
}

/** slides 레슨: 도달한 슬라이드 기준 진도율(0~100) */
export function slideProgressPercent(furthestIndex: number, totalSlides: number): number {
  if (totalSlides <= 0) return 0
  return Math.min(Math.round(((furthestIndex + 1) / totalSlides) * 100), 100)
}

export function isSlideLessonComplete(furthestIndex: number, totalSlides: number): boolean {
  if (totalSlides <= 0) return false
  return (furthestIndex + 1) / totalSlides >= 0.9
}

/** 슬라이드 1장당 기본 체류 시간(초) — duration_seconds 산정용 */
export const SECONDS_PER_SLIDE_DEFAULT = 60

export function estimateSlideLessonDuration(slideCount: number): number {
  return Math.max(slideCount, 1) * SECONDS_PER_SLIDE_DEFAULT
}
