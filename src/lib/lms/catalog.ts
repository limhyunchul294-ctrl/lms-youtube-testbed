import catalog from '../../../content/evkmc-youtube-catalog.json'

export type CatalogModule = {
  title: string
  description?: string
  lesson_ids: string[]
}

export type CatalogLessonMeta = {
  id: string
  course_id: string
  learning_objectives?: string[]
  module_title?: string
}

const lessonById = new Map(catalog.lessons.map((l) => [l.id, l]))

const modulesByCourse = new Map<string, CatalogModule[]>()
for (const c of catalog.courses) {
  const mods = (c as { learning_modules?: CatalogModule[] }).learning_modules
  if (mods?.length) modulesByCourse.set(c.id, mods)
}

export function getCatalogLessonMeta(lessonId: string): CatalogLessonMeta | null {
  const row = lessonById.get(lessonId)
  if (!row) return null
  const objectives = (row as { learning_objectives?: string[] }).learning_objectives
  let moduleTitle: string | undefined
  const mods = modulesByCourse.get(row.course_id)
  if (mods) {
    const mod = mods.find((m) => m.lesson_ids.includes(lessonId))
    moduleTitle = mod?.title
  }
  return {
    id: row.id,
    course_id: row.course_id,
    learning_objectives: objectives,
    module_title: moduleTitle,
  }
}

export function getCatalogModules(courseId: string): CatalogModule[] {
  return modulesByCourse.get(courseId) ?? []
}

export function getCatalogCourseDescription(courseId: string): string | null {
  const c = catalog.courses.find((x) => x.id === courseId)
  return c?.description ?? null
}
