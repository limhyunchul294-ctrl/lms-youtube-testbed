export interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  is_published: boolean
  sort_order: number
  created_at: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  youtube_id: string
  duration_seconds: number
  sort_order: number
  is_free: boolean
  created_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  watched_seconds: number
  is_completed: boolean
  completed_at: string | null
  updated_at: string
}

export interface LessonWithProgress {
  lesson_id: string
  lesson_title: string
  youtube_id: string
  duration_seconds: number
  sort_order: number
  watched_seconds: number
  is_completed: boolean
}

export interface AdminProgress {
  user_email: string
  course_title: string
  total_lessons: number
  completed_lessons: number
  progress_pct: number
}
