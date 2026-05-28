'use client'

import Link from 'next/link'

export default function NextActionBanner({
  title,
  detail,
  href,
  ctaLabel = '바로 이동',
}: {
  title: string
  detail?: string
  href?: string
  ctaLabel?: string
}) {
  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
      <p className="text-xs font-semibold text-blue-700">다음 학습 행동</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{title}</p>
      {detail && <p className="mt-0.5 text-xs text-slate-600">{detail}</p>}
      {href && (
        <Link
          href={href}
          className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline touch-manipulation"
        >
          {ctaLabel} →
        </Link>
      )}
    </div>
  )
}

