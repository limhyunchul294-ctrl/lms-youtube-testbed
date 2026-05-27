'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  isSlideLessonComplete,
  slideProgressPercent,
  type SlideItem,
} from '@/lib/lesson'

interface Props {
  lessonId: string
  slides: SlideItem[]
  initialSlideIndex?: number
  onComplete?: () => void
}

export default function SlideLessonPlayer({
  lessonId,
  slides,
  initialSlideIndex = 0,
  onComplete,
}: Props) {
  const total = slides.length
  const safeStart = Math.min(Math.max(initialSlideIndex, 0), Math.max(total - 1, 0))

  const [currentIndex, setCurrentIndex] = useState(safeStart)
  const [furthestIndex, setFurthestIndex] = useState(Math.max(safeStart, initialSlideIndex))
  const [completed, setCompleted] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const [watermarkUser, setWatermarkUser] = useState('')
  const [watermarkTs, setWatermarkTs] = useState('')

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let label = user.email || user.id
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.display_name) label = profile.display_name
      } catch {
        // 마이그레이션/테이블이 아직 없을 수 있습니다.
      }
      setWatermarkUser(label)
    }

    load()
    setWatermarkTs(new Date().toISOString().slice(0, 19).replace('T', ' '))
    const timer = setInterval(() => {
      setWatermarkTs(new Date().toISOString().slice(0, 19).replace('T', ' '))
    }, 10000)
    return () => clearInterval(timer)
  }, [supabase])

  const saveProgress = useCallback(
    async (index: number, markComplete: boolean) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || total <= 0) return

      const furthest = Math.max(furthestIndex, index)
      setFurthestIndex(furthest)

      const payload: Record<string, unknown> = {
        user_id: user.id,
        lesson_id: lessonId,
        last_slide_index: index,
        watched_seconds: furthest + 1,
        updated_at: new Date().toISOString(),
      }
      if (markComplete) {
        payload.is_completed = true
        payload.completed_at = new Date().toISOString()
      }

      await supabase.from('user_progress').upsert(payload, { onConflict: 'user_id,lesson_id' })
    },
    [lessonId, supabase, total, furthestIndex]
  )

  const goTo = useCallback(
    (next: number) => {
      if (total <= 0) return
      const clamped = Math.min(Math.max(next, 0), total - 1)
      const furthest = Math.max(furthestIndex, clamped)
      setCurrentIndex(clamped)
      setFurthestIndex(furthest)
      const done = isSlideLessonComplete(furthest, total)
      if (done && !completed) {
        setCompleted(true)
        saveProgress(clamped, true)
        onComplete?.()
      } else {
        saveProgress(clamped, false)
      }
    },
    [total, completed, saveProgress, onComplete, furthestIndex]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(currentIndex + 1)
      if (e.key === 'ArrowLeft') goTo(currentIndex - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentIndex, goTo])

  useEffect(() => {
    if (total <= 0) return
    const timer = setInterval(() => {
      saveProgress(currentIndex, isSlideLessonComplete(furthestIndex, total))
    }, 30000)
    return () => clearInterval(timer)
  }, [currentIndex, total, furthestIndex, saveProgress])

  useEffect(() => {
    saveProgress(safeStart, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (total === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">등록된 슬라이드가 없습니다.</p>
    )
  }

  const slide = slides[currentIndex]
  const progressPct = slideProgressPercent(furthestIndex, total)

  return (
    <div>
      <div
        className="slide-viewer rounded-xl border border-slate-200 bg-slate-900 overflow-hidden touch-pan-y"
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const dx = e.changedTouches[0].clientX - touchStartX.current
          touchStartX.current = null
          if (Math.abs(dx) < 40) return
          if (dx < 0) goTo(currentIndex + 1)
          else goTo(currentIndex - 1)
        }}
      >
        <div className="relative aspect-[16/10] md:aspect-video bg-slate-800">
          {watermarkUser && (
            <div className="absolute right-3 top-3 z-20 pointer-events-none select-none bg-black/45 text-white px-2.5 py-1 rounded-md text-[10px] font-mono">
              EVKMC · {watermarkUser} · {watermarkTs}
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image_url}
            alt={slide.title || `슬라이드 ${currentIndex + 1}`}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
        </div>
        {(slide.title || slide.caption) && (
          <div className="px-4 py-3 bg-white border-t border-slate-100">
            {slide.title && (
              <div className="text-sm font-semibold text-slate-900">{slide.title}</div>
            )}
            {slide.caption && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{slide.caption}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50"
        >
          ← 이전
        </button>
        <span className="text-xs text-slate-500 tabular-nums">
          {currentIndex + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex >= total - 1}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50"
        >
          다음 →
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="progress-bar">
          <div
            className={`progress-bar-fill ${completed ? 'complete' : ''}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>슬라이드 학습 · {progressPct}% 열람</span>
          {completed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              ✓ 수강 완료
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        💡 이 페이지에서 넘겨야 진도가 기록됩니다. 슬라이드 90% 이상 열람 시 자동 완료됩니다. (키보드 ← →, 모바일 스와이프)
      </p>
    </div>
  )
}
