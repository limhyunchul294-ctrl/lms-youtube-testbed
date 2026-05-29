'use client'

import Link from 'next/link'
import type { LearnerProfile } from '@/lib/profile'
import {
  buildGswProfileLines,
  formatGswGradeLabel,
  formatGswRoleLabel,
} from '@/lib/gsw-profile-labels'

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">{label}</label>
      <input
        type="text"
        readOnly
        value={value}
        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-slate-50 text-[var(--text)] text-sm"
      />
    </div>
  )
}

export default function AccountInfoView({
  profile,
  sessionEmail,
  lastSignIn,
  createdAt,
  gswPortalUrl,
}: {
  profile: LearnerProfile
  sessionEmail: string
  lastSignIn: string | null
  createdAt: string | null
  gswPortalUrl?: string
}) {
  const lines = buildGswProfileLines(profile)
  const gradeLabel = formatGswGradeLabel(profile.gsw_grade)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">계정 정보</h2>
          <p className="text-xs text-[var(--text-muted)]">
            GSW 포털 «내 정보»와 동일한 항목입니다. 변경은 관리자에게 문의해 주세요.
          </p>

          <ReadonlyField label="이름" value={profile.display_name || '정보 없음'} />
          <ReadonlyField label="소속" value={profile.department || '정보 없음'} />
          <ReadonlyField
            label="권한"
            value={formatGswRoleLabel(profile.gsw_role) || '정보 없음'}
          />
          <ReadonlyField label="연락처" value={profile.phone || '정보 없음'} />
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
              등급 (Grade)
            </label>
            <span
              className={`inline-block px-3 py-2 border border-[var(--border)] rounded-lg bg-slate-50 text-sm font-semibold ${
                profile.gsw_grade === 'black'
                  ? 'text-gray-900'
                  : profile.gsw_grade === 'silver'
                    ? 'text-gray-600'
                    : 'text-blue-600'
              }`}
            >
              {gradeLabel}
            </span>
          </div>
          {profile.gsw_username && (
            <ReadonlyField label="아이디" value={profile.gsw_username} />
          )}
          <ReadonlyField label="이메일" value={profile.email || sessionEmail} />
          {profile.gsw_user_id && (
            <ReadonlyField label="포털 ID" value={profile.gsw_user_id} />
          )}

          {gswPortalUrl && (
            <a
              href={`${gswPortalUrl.replace(/\/$/, '')}/account`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm text-[var(--accent)] hover:underline"
            >
              GSW 포털에서 추가 정보 보기 →
            </a>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">LMS 세션</h2>
          <ReadonlyField label="로그인 이메일" value={sessionEmail} />
          {lastSignIn && (
            <ReadonlyField
              label="마지막 로그인"
              value={new Date(lastSignIn).toLocaleString('ko-KR')}
            />
          )}
          {createdAt && (
            <ReadonlyField
              label="계정 생성"
              value={new Date(createdAt).toLocaleDateString('ko-KR')}
            />
          )}
          <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
            화면 배경 워터마크는 GSW와 같이 «소속 - 이름 - IP - 날짜» 형식으로 표시됩니다.
          </p>
        </div>
      </div>

      {lines.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--text-muted)] mb-2">요약</p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {lines.map((l) => (
              <div key={l.label}>
                <dt className="text-[var(--text-muted)] text-xs">{l.label}</dt>
                <dd className="font-medium text-[var(--text)] truncate">{l.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="text-center">
        <Link href="/dashboard" className="text-sm text-[var(--accent)] hover:underline">
          ← 내 학습으로
        </Link>
      </p>
    </div>
  )
}
