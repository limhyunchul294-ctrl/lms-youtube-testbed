'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchLearnerWatermarkLabel, formatWatermarkLine } from '@/lib/watermark'

const TILE_COUNT = 42

/**
 * GSW 포털 스타일: 페이지 배경에 은은한 대각선 반복 워터마크.
 * 영상/슬라이드 위가 아니라 콘텐츠 영역 전체에만 적용 (시청 방해 최소화).
 */
export default function PageWatermark() {
  const supabase = useMemo(() => createClient(), [])
  const [line, setLine] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined

    const refresh = async () => {
      const label = await fetchLearnerWatermarkLabel(supabase)
      if (label) setLine(formatWatermarkLine(label))
    }

    refresh()
    timer = setInterval(refresh, 60_000)

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [supabase])

  if (!line) return null

  return (
    <div className="page-watermark" aria-hidden>
      <div className="page-watermark__grid">
        {Array.from({ length: TILE_COUNT }, (_, i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    </div>
  )
}
