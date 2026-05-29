'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchGswWatermarkText } from '@/lib/watermark'

/**
 * GSW #watermark-overlay 와 동일: 전체 화면 고정, 대각선 반복, 동일 텍스트 형식.
 */
export default function PageWatermark() {
  const supabase = useMemo(() => createClient(), [])
  const overlayRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState<string | null>(null)

  const paintTiles = useCallback((watermarkText: string) => {
    const watermark = overlayRef.current
    if (!watermark) return

    watermark.innerHTML = ''

    const textWidth = 300
    const textHeight = 100
    const cols = Math.ceil(window.innerWidth / textWidth)
    const rows = Math.ceil(window.innerHeight / textHeight)
    const total = cols * rows

    for (let i = 0; i < total; i++) {
      const span = document.createElement('span')
      span.textContent = watermarkText
      span.style.position = 'absolute'
      span.style.color = 'rgba(0, 0, 0, 0.06)'
      span.style.fontSize = '14px'
      span.style.fontWeight = '600'
      span.style.transform = 'rotate(-30deg)'
      span.style.whiteSpace = 'nowrap'
      span.style.pointerEvents = 'none'
      span.style.userSelect = 'none'

      const col = i % cols
      const row = Math.floor(i / cols)
      span.style.left = `${col * textWidth + 50}px`
      span.style.top = `${row * textHeight + 50}px`

      watermark.appendChild(span)
    }
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined

    const refresh = async () => {
      const line = await fetchGswWatermarkText(supabase)
      if (line) {
        setText(line)
        paintTiles(line)
      }
    }

    refresh()
    timer = setInterval(refresh, 60_000)

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [supabase, paintTiles])

  useEffect(() => {
    if (!text) return

    const onResize = () => paintTiles(text)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [text, paintTiles])

  if (!text) return null

  return <div ref={overlayRef} className="gsw-watermark-overlay" aria-hidden />
}
