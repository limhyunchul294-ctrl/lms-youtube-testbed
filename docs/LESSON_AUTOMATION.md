# 레슨·수강 자동화 가이드

브릿지(포털 SSO) 인증은 후순위입니다. 현재 LMS는 **독립 로그인**과 **레슨 스키마·플레이어·진도 저장**에 집중합니다.

## 레슨 유형

| `lesson_type` | 플레이어 | 진도 필드 |
|---------------|----------|-----------|
| `video` (기본) | YouTube IFrame | `watched_seconds`, 90% 시 완료 |
| `slides` | `SlideLessonPlayer` | `last_slide_index`, 90% 슬라이드 도달 시 완료 |

슬라이드 JSON (`lessons.slides`):

```json
[
  { "image_url": "https://...", "title": "표지", "caption": "설명(선택)" }
]
```

## 수강 플로우 (안정화)

1. `/` 로그인 또는 회원가입
2. `/courses` → 강의 선택 → **수강 신청**
3. `/course/[id]` 레슨 목록 → `/lesson/[id]`
4. **수강 신청 없이** 레슨 URL 직접 접근 시 차단 메시지 표시

## 관리자 자동화 API

모든 요청에 `x-sync-key: $SYNC_API_KEY` (또는 `?key=`).

| API | 용도 |
|-----|------|
| `POST /api/admin/seed-sample` | 샘플 강의·영상·슬라이드 레슨 upsert |
| `POST /api/admin/seed-progress` | student1~3 계정·수강·진도 시드 |
| `POST /api/admin/reset-sample` | 샘플 데이터 삭제 |
| `POST /api/admin/upsert-slide-lesson` | 슬라이드 레슨 단건 upsert |

### 슬라이드 레슨 upsert 예시

```bash
curl -X POST "https://lms-youtube-testbed.vercel.app/api/admin/upsert-slide-lesson" \
  -H "Content-Type: application/json" \
  -H "x-sync-key: YOUR_SYNC_API_KEY" \
  -d '{
    "course_id": "11111111-1111-1111-1111-111111111111",
    "title": "5강. 요약 (슬라이드)",
    "sort_order": 5,
    "slides": [
      { "image_url": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200", "title": "1. 개요" },
      { "image_url": "https://images.unsplash.com/photo-1593941707882-a5bac983da8a?w=1200", "title": "2. 정리" }
    ]
  }'
```

## DB 마이그레이션 (Supabase CLI)

### 1. 사전 확인

| 항목 | 값 |
|------|-----|
| 프로젝트 ref | `fcemgcytxgkwevpljqlp` |
| 이름 | `lms-youtube-testbed` |
| 리전 | `ap-northeast-2` (서울) |
| DB 호스트(직접) | `db.fcemgcytxgkwevpljqlp.supabase.co` |

**프로젝트가 일시 중지(Paused)면** CLI에서 `Tenant or user not found` / `tenant/user postgres... not found` 가 납니다.  
대시보드에서 먼저 **Resume project** 하세요:  
https://supabase.com/dashboard/project/fcemgcytxgkwevpljqlp

### 2. CLI 로그인·링크 (Windows PowerShell)

```powershell
cd d:\LMS\lms-project

# 최신 CLI 권장 (전역 2.54.x 보다 npx 사용)
npx supabase@latest login

# DB 비밀번호: Dashboard → Project Settings → Database → Database password
npx supabase@latest link --project-ref fcemgcytxgkwevpljqlp -p "YOUR_DB_PASSWORD"

# 또는 환경변수로 (비밀번호를 파일에 넣지 않을 때)
$env:SUPABASE_DB_PASSWORD = "YOUR_DB_PASSWORD"
npx supabase@latest link --project-ref fcemgcytxgkwevpljqlp

npx supabase@latest db push
```

`supabase projects list` 에서 `lms-youtube-testbed` 의 **status** 가 `ACTIVE_HEALTHY` 인지 확인한 뒤 `db push` 하세요.

### 3. 여전히 연결 실패할 때

- **Connection string** 의 Pooler **Host** 를 대시보드에서 그대로 복사 (리전별 `aws-0` / `aws-1` 이 다를 수 있음)
- **Network Restrictions**: 본인 PC IP 허용 (Database → Settings)
- Docker 없이 원격만 쓸 때: `supabase status` 는 로컬용이라 실패해도 무시 가능

마이그레이션 파일: `supabase/migrations/20250409000000_lesson_slides.sql`

## 데모 시연 순서

1. 관리자 `/admin` → **원클릭 데모 준비**
2. `student1@example.com` / `Sample1234!` 로 로그인
3. 강의 수강 → 영상·슬라이드 레슨 진도 확인
4. (선택) `NEXT_PUBLIC_DEMO_MODE=true` → KPI 패널

## Cron (Airtable 동기화)

`vercel.json`: `POST /api/sync/airtable` — `Authorization: Bearer $CRON_SECRET`

진도·완료는 Supabase `user_progress`가 기준이며, Airtable은 리포팅용(B안)입니다.
