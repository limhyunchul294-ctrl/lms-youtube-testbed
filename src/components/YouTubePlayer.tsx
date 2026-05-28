'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
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

let apiReadyQueue: Array<() => void> = []
let apiLoading = false

function loadYouTubeIframeApi(origin: string) {
  if (window.YT?.Player) return Promise.resolve()

  return new Promise<void>((resolve) => {
    apiReadyQueue.push(resolve)

    if (apiLoading) return
    apiLoading = true

    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      apiReadyQueue.forEach((fn) => fn())
      apiReadyQueue = []
    }

    const tag = document.createElement('script')
    tag.src = `https://www.youtube.com/iframe_api?origin=${encodeURIComponent(origin)}`
    document.head.appendChild(tag)
  })
}

export default function YouTubePlayer({
  youtubeId,
  lessonId,
  durationSeconds,
  initialWatched = 0,
  onComplete,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [currentTime, setCurrentTime] = useState(initialWatched)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [embedBlocked, setEmbedBlocked] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`

  const saveProgress = useCallback(
    async (seconds: number, markComplete: boolean) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const payload: Record<string, unknown> = {
        user_id: user.id,
        lesson_id: lessonId,
        watched_seconds: Math.floor(seconds),
        updated_at: new Date().toISOString(),
      }
      if (markComplete) {
        payload.is_completed = true
        payload.completed_at = new Date().toISOString()
      }

      await supabase.from('user_progress').upsert(payload, { onConflict: 'user_id,lesson_id' })
    },
    [lessonId, supabase]
  )

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTracking = useCallback(() => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      if (!playerRef.current?.getCurrentTime) return
      const t = playerRef.current.getCurrentTime()
      const dur = playerRef.current.getDuration() || durationSeconds
      setCurrentTime(Math.floor(t))

      if (Math.floor(t) % 30 === 0) {
        saveProgress(t, false)
      }

      if (dur > 0 && t / dur >= 0.9 && !completed) {
        setCompleted(true)
        saveProgress(t, true)
        onComplete?.()
      }
    }, 1000)
  }, [completed, durationSeconds, onComplete, saveProgress])

  useEffect(() => {
    const origin = window.location.origin
    let cancelled = false

    const initPlayer = () => {
      if (!containerRef.current || cancelled) return

      playerRef.current?.destroy()
      playerRef.current = null
      containerRef.current.innerHTML = ''
      setEmbedBlocked(false)

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: {
          enablejsapi: 1,
          origin,
          widget_referrer: origin,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 1,
          start: initialWatched > 10 ? initialWatched - 5 : 0,
          playsinline: 1,
        },
        events: {
          onStateChange: (e: { data: number; target: { getCurrentTime: () => number } }) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setEmbedBlocked(false)
              setIsPlaying(true)
              startTracking()
            } else {
              setIsPlaying(false)
              stopTracking()
              if (e.data === window.YT.PlayerState.PAUSED) {
                saveProgress(e.target.getCurrentTime(), false)
              }
            }
          },
          onError: () => {
            setEmbedBlocked(true)
          },
        },
      })
    }

    loadYouTubeIframeApi(origin).then(() => {
      if (!cancelled) initPlayer()
    })

    return () => {
      cancelled = true
      stopTracking()
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [youtubeId, initialWatched, saveProgress, startTracking, stopTracking])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progressPct =
    durationSeconds > 0 ? Math.min((currentTime / durationSeconds) * 100, 100) : 0

  return (
    <div>
      <div className="video-wrapper">
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      {embedBlocked && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">이 페이지에서는 재생할 수 없습니다</p>
          <p className="mt-1 text-xs text-amber-800/90">
            YouTube에서 <strong>임베드(다른 사이트 삽입)</strong>가 꺼져 있으면 LMS에서 재생되지 않습니다.
            YouTube에서는 직접 재생은 되어도 임베드만 막을 수 있습니다.
          </p>
          <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-amber-900/90">
            <li>YouTube Studio → <strong>콘텐츠</strong></li>
            <li>영상 7개 선택(또는 상단 전체 선택)</li>
            <li><strong>편집</strong> → <strong>삽입(임베드)</strong> → <strong>켜기</strong> → 업데이트</li>
            <li>각 영상에서도 <strong>세부정보 → 더보기</strong> → 라이선스·배포 → <strong>삽입 허용</strong> 확인</li>
          </ol>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs font-medium text-blue-700 underline"
          >
            YouTube에서 직접 보기 (진도는 이 페이지 시청 시에만 기록됨)
          </a>
        </div>
      )}

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

      <p className="mt-2 text-xs text-slate-400">
        LMS 도메인: <span className="font-mono">{typeof window !== 'undefined' ? window.location.origin : ''}</span>
        {' · '}
        이 페이지에서 시청해야 진도가 기록됩니다.
      </p>
    </div>
  )
}
