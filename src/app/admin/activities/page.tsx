'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase'
import { EVKMC_COURSE_IDS } from '@/lib/evkmc'
import type { ActivityType, CourseActivity } from '@/lib/types'
import ActivityVisualEditor from '@/components/admin/ActivityVisualEditor'
import { publicRef } from '@/lib/routes'

export default function AdminActivitiesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [activities, setActivities] = useState<CourseActivity[]>([])
  const [courseTitles, setCourseTitles] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [configJson, setConfigJson] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [advanced, setAdvanced] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        router.push('/dashboard')
        return
      }

      const [{ data }, { data: courses }] = await Promise.all([
        supabase
          .from('course_activities')
          .select('*')
          .order('course_id')
          .order('sort_order'),
        supabase.from('courses').select('id, title'),
      ])

      const titles: Record<string, string> = {}
      for (const c of courses || []) {
        if (c.id && c.title) titles[c.id] = c.title
      }
      setCourseTitles(titles)

      setActivities((data || []) as CourseActivity[])
      if (data?.[0]) {
        setSelectedId(data[0].id)
        setConfigJson(JSON.stringify(data[0].config, null, 2))
      }
      setLoading(false)
    }
    init()
  }, [router, supabase])

  const filteredActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return activities.filter((act) => {
      if (courseFilter !== 'all' && act.course_id !== courseFilter) return false
      if (typeFilter !== 'all' && act.activity_type !== typeFilter) return false
      if (!q) return true
      const haystack = [
        act.title,
        act.description ?? '',
        act.slug ?? '',
        act.activity_type,
        courseTitles[act.course_id] ?? '',
        publicRef(act),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [activities, searchQuery, courseFilter, typeFilter, courseTitles])

  const selected = activities.find((a) => a.id === selectedId)

  const selectActivity = (act: CourseActivity) => {
    setSelectedId(act.id)
    setConfigJson(JSON.stringify(act.config, null, 2))
    setMessage(null)
  }

  const saveConfig = async () => {
    if (!selected) return
    setSaving(true)
    setMessage(null)
    try {
      const config = JSON.parse(configJson)
      const res = await fetch('/api/admin/upsert-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          course_id: selected.course_id,
          activity_type: selected.activity_type,
          title: selected.title,
          description: selected.description,
          config,
          sort_order: selected.sort_order,
          is_required: selected.is_required,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '저장 실패')
      setMessage('저장되었습니다.')
      setActivities((prev) =>
        prev.map((a) => (a.id === selected.id ? { ...a, config } : a))
      )
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '저장 중 오류')
    }
    setSaving(false)
  }

  const importExamBank = async (courseId: string, count: number) => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/import-exam-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, use_bank: true, question_count: count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'import 실패')
      setMessage(`시험 문항 ${data.question_count}개 반영 완료 (${courseId === EVKMC_COURSE_IDS.eco ? '친환경차' : '고전압'})`)
      const { data: refreshed } = await supabase
        .from('course_activities')
        .select('*')
        .eq('id', data.activity_id)
        .single()
      if (refreshed) {
        setActivities((prev) => prev.map((a) => (a.id === refreshed.id ? (refreshed as CourseActivity) : a)))
        if (selectedId === refreshed.id) {
          setConfigJson(JSON.stringify(refreshed.config, null, 2))
        }
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'import 오류')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-center py-20 text-sm text-[var(--text-muted)]">불러오는 중…</div>
      </AppShell>
    )
  }

  return (
    <AppShell title="활동·시험 관리" subtitle="화면 미리보기로 편집 · 상세 수정 시 JSON config">
      <Link href="/admin" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] mb-4 inline-block">
        ← 수강 관리
      </Link>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          disabled={saving}
          onClick={() => importExamBank(EVKMC_COURSE_IDS.eco, 30)}
          className="px-3 py-2 text-xs rounded-lg bg-[var(--accent)] text-white font-medium disabled:opacity-50"
        >
          친환경차 시험 30문항 시드
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => importExamBank(EVKMC_COURSE_IDS.hv, 60)}
          className="px-3 py-2 text-xs rounded-lg bg-[var(--accent)] text-white font-medium disabled:opacity-50"
        >
          고전압 시험 60문항 시드
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 text-sm px-3 py-2 rounded-lg ${
            message.includes('완료') || message.includes('저장')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목·slug·설명 검색"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              >
                <option value="all">전체 코스</option>
                {Object.entries(courseTitles).map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | ActivityType)}
                className="rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              >
                <option value="all">전체 유형</option>
                <option value="guide">guide</option>
                <option value="evaluation">evaluation</option>
                <option value="exam">exam</option>
              </select>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              {filteredActivities.length}개 표시 · 전체 {activities.length}개
            </p>
          </div>

          {filteredActivities.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] px-1">조건에 맞는 활동이 없습니다.</p>
          ) : (
            filteredActivities.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => selectActivity(act)}
                className={`w-full text-left rounded-xl border p-3 text-sm transition ${
                  selectedId === act.id
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-slate-300'
                }`}
              >
                <span className="text-[10px] uppercase text-[var(--text-muted)]">{act.activity_type}</span>
                <p className="font-medium text-[var(--text)] mt-0.5">{act.title}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                  {courseTitles[act.course_id] ?? act.course_id.slice(0, 8)}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {act.slug || publicRef(act)}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          {selected ? (
            <>
              <h2 className="font-semibold text-[var(--text)]">{selected.title}</h2>
              <ActivityVisualEditor
                activity={selected}
                configJson={configJson}
                onConfigJsonChange={setConfigJson}
                advanced={advanced}
                onAdvancedChange={setAdvanced}
              />
              <button
                type="button"
                disabled={saving}
                onClick={saveConfig}
                className="mt-3 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? '저장 중…' : 'config 저장'}
              </button>
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">활동을 선택하세요.</p>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        docx 문항은 JSON으로 변환 후 위 textarea에 붙여넣거나{' '}
        <code className="text-[10px]">POST /api/admin/import-exam-questions</code> API를 사용하세요. 저장소{' '}
        <code className="text-[10px]">docs/EXAM_IMPORT.md</code> 참고.
      </p>
    </AppShell>
  )
}
