'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

interface Props {
  youtubeId: string
  lessonId: string
  durationSeconds: number
  initialWatched?: number
  onComplete?: () => void
}

export default function YouTubePlayer({
  youtubeId,
  lessonId,
  durationSeconds,
  initialWatched = 0,
  onComplete,
}: Props) {
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [currentTime, setCurrentTime] = useState(initialWatched)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completed, setCompleted] = useState(false)
  const supabase = createClient()

  // 진도 저장
  const saveProgress = useCallback(async (seconds: number, markComplete: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload: any = {
      user_id: user.id,
      lesson_id: lessonId,
      watched_seconds: Math.floor(seconds),
      updated_at: new Date().toISOString(),
    }
    if (markComplete) {
      payload.is_completed = true
      payload.completed_at = new Date().toISOString()
    }

    await supabase
      .from('user_progress')
      .upsert(payload, { onConflict: 'user_id,lesson_id' })
  }, [lessonId, supabase])

  // YouTube IFrame API 로드
  useEffect(() => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'

    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]')
    if (!existing) {
      document.head.appendChild(tag)
    }

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy()
      }
      playerRef.current = new window.YT.Player('yt-player', {
        videoId: youtubeId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          cc_load_policy: 1,
          start: initialWatched > 10 ? initialWatched - 5 : 0,
          playsinline: 1, // 모바일 인라인 재생
        },
        events: {
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              startTracking()
            } else {
              setIsPlaying(false)
              stopTracking()
              if (e.data === window.YT.PlayerState.PAUSED) {
                const t = playerRef.current?.getCurrentTime() || 0
                saveProgress(t, false)
              }
            }
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      stopTracking()
      playerRef.current?.destroy()
    }
  }, [youtubeId])

  const startTracking = () => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      if (!playerRef.current?.getCurrentTime) return
      const t = playerRef.current.getCurrentTime()
      const dur = playerRef.current.getDuration() || durationSeconds
      setCurrentTime(Math.floor(t))

      // 30초마다 저장
      if (Math.floor(t) % 30 === 0) {
        saveProgress(t, false)
      }

      // 90% 이상 시청 시 완료 처리
      if (dur > 0 && t / dur >= 0.9 && !completed) {
        setCompleted(true)
        saveProgress(t, true)
        onComplete?.()
      }
    }, 1000)
  }

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progressPct = durationSeconds > 0
    ? Math.min((currentTime / durationSeconds) * 100, 100)
    : 0

  return (
    <div>
      <div className="video-wrapper">
        <div id="yt-player" />
      </div>

      {/* 진도 상태 바 */}
      <div className="mt-3 space-y-1.5">
        <div className="progress-bar">
          <div
            className={`progress-bar-fill ${completed ? 'complete' : ''}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>
            {isPlaying ? '▶ 재생 중' : '⏸ 일시정지'}
            {' · '}
            {formatTime(currentTime)} / {formatTime(durationSeconds)}
          </span>
          {completed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              ✓ 수강 완료
            </span>
          )}
        </div>
      </div>

      {/* 안내 메시지 */}
      <p className="mt-2 text-xs text-slate-400">
        💡 이 페이지에서 시청해야 진도율이 기록됩니다. 90% 이상 시청 시 자동 완료 처리됩니다.
      </p>
    </div>
  )
}
