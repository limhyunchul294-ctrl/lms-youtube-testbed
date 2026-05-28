export interface Course {
  id: string
  slug?: string | null
  title: string
  description: string | null
  thumbnail_url: string | null
  is_published: boolean
  sort_order: number
  created_at?: string
}

export type LessonType = 'video' | 'slides'

export interface SlideItem {
  image_url: string
  title?: string
  caption?: string
}

export interface Lesson {
  id: string
  slug?: string | null
  course_id: string
  title: string
  lesson_type: LessonType
  youtube_id: string
  slides: SlideItem[] | null
  duration_seconds: number
  sort_order: number
  is_free: boolean
}

export interface UserProgress {
  watched_seconds: number
  is_completed: boolean
  last_slide_index?: number
}

export interface LessonWithProgress {
  lesson_id: string
  lesson_title: string
  lesson_type: LessonType
  youtube_id: string
  duration_seconds: number
  sort_order: number
  watched_seconds: number
  is_completed: boolean
  slide_count: number
  last_slide_index: number
}

export interface CourseProgressRow {
  user_id: string
  user_email: string
  course_id: string
  course_title: string
  total_lessons: number
  completed_lessons: number
}

export interface AdminProgress {
  user_email: string
  course_title: string
  total_lessons: number
  completed_lessons: number
  progress_pct: number
}

export type ActivityType = 'guide' | 'evaluation' | 'exam'

export interface CourseActivity {
  id: string
  slug?: string | null
  course_id: string
  activity_type: ActivityType
  title: string
  description: string | null
  config: Record<string, unknown>
  sort_order: number
  is_required: boolean
}

export interface ActivitySubmission {
  id: string
  user_id: string
  activity_id: string
  answers: Record<string, unknown>
  score: number | null
  passed: boolean | null
  submitted_at: string
}

export interface CourseLearningStatus {
  total_lessons: number
  completed_lessons: number
  total_required_activities: number
  completed_required_activities: number
  lessons_complete: boolean
  activities_complete: boolean
  course_complete: boolean
}
