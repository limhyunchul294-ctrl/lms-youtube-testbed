import catalog from '../../content/evkmc-youtube-catalog.json'

export type EvkmcCourse = (typeof catalog.courses)[number]
export type EvkmcLesson = (typeof catalog.lessons)[number] & {
  lesson_type: 'video'
  is_free: boolean
}

export const evkmcYoutubeCatalog = catalog

export function buildEvkmcLessonRows(
  youtubeIds: string[]
): Array<EvkmcLesson & { course_id: string; id: string; youtube_id: string; duration_seconds: number; sort_order: number; title: string }> {
  if (youtubeIds.length !== catalog.lessons.length) {
    throw new Error(`youtube_ids는 ${catalog.lessons.length}개 필요합니다 (1강~7강 순서).`)
  }
  return catalog.lessons.map((lesson, i) => ({
    ...lesson,
    lesson_type: 'video' as const,
    is_free: false,
    youtube_id: youtubeIds[i]!.trim(),
    slides: null,
  }))
}
