'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { videoWatchPercent } from '@/lib/lesson'

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
  const [videoDuration, setVideoDuration] = useState(durationSeconds)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [embedBlocked, setEmbedBlocked] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`

  const effectiveDuration = videoDuration > 0 ? videoDuration : durationSeconds

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
      const dur = playerRef.current.getDuration() || effectiveDuration
      if (dur > 0 && dur !== videoDuration) setVideoDuration(Math.floor(dur))
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
  }, [completed, effectiveDuration, onComplete, saveProgress, videoDuration])

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
          /** Studio «플레이어 컨트롤 표시» 해제와 동일 — 재생 버튼만 노출 */
          controls: 0,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          start: initialWatched > 10 ? initialWatched - 5 : 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: { target: { getDuration: () => number } }) => {
            const dur = e.target.getDuration()
            if (dur > 0) setVideoDuration(Math.floor(dur))
          },
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

  const progressPct = videoWatchPercent(currentTime, effectiveDuration)
  const completionTargetPct = 90

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
          </p>
          <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-amber-900/90">
            <li>YouTube Studio → <strong>콘텐츠</strong></li>
            <li>영상 선택 → <strong>편집</strong> → <strong>삽입(임베드)</strong> → <strong>켜기</strong></li>
            <li>퍼가기 시 <strong>플레이어 컨트롤 표시</strong>는 LMS에서 별도 적용됩니다</li>
          </ol>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs font-medium text-blue-700 underline"
          >
            YouTube에서 직접 보기
          </a>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
        <div className="flex items-end justify-between gap-3 mb-2">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">수강 진도</p>
            <p className="text-2xl sm:text-3xl font-bold text-[var(--accent)] tabular-nums">
              {progressPct}
              <span className="text-lg font-semibold">%</span>
            </p>
          </div>
          <div className="text-right text-xs text-[var(--text-muted)] tabular-nums">
            <p>{isPlaying ? '▶ 재생 중' : '⏸ 일시정지'}</p>
            <p className="mt-0.5">
              {formatTime(currentTime)} / {formatTime(effectiveDuration)}
            </p>
          </div>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div
            className={`progress-bar-fill ${completed ? 'complete' : ''}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex flex-wrap justify-between items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
          <span>
            {completed
              ? '수강 완료 처리됨'
              : `완료 기준 ${completionTargetPct}% 이상 시청`}
          </span>
          {completed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              ✓ 수강 완료
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        영상은 재생·일시정지만 가능합니다(진도 바·볼륨 등 YouTube 컨트롤 숨김). 이 페이지에서 시청해야
        진도가 기록됩니다.
      </p>
    </div>
  )
}
