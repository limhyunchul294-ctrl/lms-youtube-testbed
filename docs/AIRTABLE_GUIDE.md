# Airtable 연동 가이드 (B안: 진도 현황 뷰어)

## 구조 요약

```
Supabase (메인 DB)          →  동기화 API  →  Airtable (관리 뷰어)
├─ 인증/보안 (RLS)                           ├─ courses: 강의 목록
├─ 실시간 진도 추적                           ├─ lessons: 레슨 목록
├─ 수강생 데이터                              ├─ progress: 수강생별 진도 (핵심)
└─ API Routes                               └─ students: 수강생 요약
```

- **Supabase**: 보안, 인증, 실시간 데이터 수집 담당
- **Airtable**: 비개발자 관리자가 수강 현황을 열람/필터/공유하는 뷰어

---

## 1단계: Airtable 준비

### 1-1. Personal Access Token 발급

1. https://airtable.com/create/tokens 접속
2. "Create new token" 클릭
3. 설정:
   - **Name**: `LMS Sync`
   - **Scopes**: `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write`
   - **Access**: 생성할 Base 선택 (또는 All bases)
4. "Create token" → 토큰 복사 → `.env.local`의 `AIRTABLE_PERSONAL_TOKEN`에 입력

### 1-2. Base 생성

1. Airtable 홈 → "Create a base" → 이름: `LMS 수강관리`
2. Base URL에서 Base ID 확인: `https://airtable.com/appXXXXXXXXXXXXXX/...`
   - `app`으로 시작하는 문자열이 Base ID
3. `.env.local`의 `AIRTABLE_BASE_ID`에 입력

### 1-3. 테이블 자동 생성

기본 테이블("Table 1")은 삭제하고, 스크립트로 4개 테이블을 자동 생성:

```bash
node setup-airtable.js
```

수동으로 만들려면 아래 구조 참고:

| 테이블 | 주요 필드 | 용도 |
|--------|----------|------|
| courses | course_id, title, description, is_published | 강의 목록 |
| lessons | lesson_id, course_name, title, youtube_id, duration_min | 레슨 목록 |
| progress | sync_key, email, course, completed, total, progress_pct, status | 진도 현황 (핵심) |
| students | email, enrolled_courses, overall_pct, status | 수강생 요약 |

---

## 2단계: 환경변수 설정

`.env.local`에 추가:

```
AIRTABLE_PERSONAL_TOKEN=pat_xxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Supabase Settings → API → service_role
SYNC_API_KEY=my-secret-sync-key-12345
NEXT_PUBLIC_SYNC_API_KEY=my-secret-sync-key-12345
```

Vercel에도 동일한 값 등록 (Settings → Environment Variables)

---

## 3단계: 동기화 실행

### 방법 A: 관리자 대시보드에서 수동 클릭

LMS 관리 페이지(`/admin`)에서 **"📊 Airtable 동기화"** 버튼 클릭

### 방법 B: API 직접 호출

```bash
curl -X POST https://your-lms.vercel.app/api/sync/airtable \
  -H "x-sync-key: my-secret-sync-key-12345"
```

### 방법 C: Vercel Cron (자동 스케줄)

`vercel.json`에 추가하면 매일 자동 동기화됩니다.  
권장 방식은 쿼리스트링 키 대신 **Vercel의 `CRON_SECRET` 환경변수 인증**입니다.

```json
{
  "crons": [
    {
      "path": "/api/sync/airtable",
      "schedule": "0 9 * * *"
    }
  ]
}
```

추가로 Vercel 환경변수에 `CRON_SECRET`을 등록하면, Cron 요청 시
`Authorization: Bearer <CRON_SECRET>` 헤더가 자동으로 전달됩니다.

> 참고: Vercel Hobby 플랜은 Cron 1개까지 무료, 일 1회 실행 가능

### 방법 D: n8n / Make 연동

n8n이나 Make(Integromat) 무료 플랜에서 HTTP Request 노드로
POST 호출을 스케줄링하면 더 유연한 주기 설정 가능

---

## 4단계: Airtable 뷰 설정 (추천)

### progress 테이블

1. **Grid View (기본)**: 전체 진도 데이터 열람, 이메일로 정렬
2. **Kanban View**: status 필드 기준 → 미시작 / 학습중 / 수료완료 3개 열
3. **Filter View**: progress_pct < 30% 수강생만 표시 → "독려 대상" 뷰
4. **Group View**: course 필드로 그룹핑 → 강의별 수강생 현황

### students 테이블

1. **Gallery View**: 수강생 카드 형태로 시각화
2. **Filter View**: status = "미시작" → 관리 대상
3. **Sort**: overall_pct 오름차순 → 진도 낮은 순

### 활용 팁

- **공유 뷰**: Airtable의 "Share view" 기능으로 읽기전용 링크 생성 → 다른 운영진에게 공유
- **알림 자동화**: Airtable Automation으로 "status가 수료완료로 변경 시 슬랙 알림" 설정 가능 (무료 100회/월)
- **CSV 내보내기**: 언제든 Grid View에서 CSV 다운로드 가능

---

## 레코드 한도 관리

Airtable 무료 플랜: base당 1,000 레코드 (전 테이블 합산)

예상 레코드 수:
- courses: ~10건
- lessons: ~50건
- progress: 100명 × 5개 강의 = ~500건
- students: ~100건
- **합계: ~660건** → 무료 한도 내 충분

강의가 10개 이상으로 늘면 progress 테이블이 1,000건을 초과할 수 있음.
이 경우 "최근 활성 수강생만 동기화" 필터를 동기화 API에 추가하면 해결.

---

## 데이터 흐름 요약

```
수강생 시청 → YouTube IFrame API → Next.js → Supabase (user_progress)
                                                    ↓
                                              동기화 API 호출
                                                    ↓
                                              Airtable 업데이트
                                                    ↓
                                      관리자가 Grid/Kanban/Gallery로 조회
```

핵심: 수강생은 Airtable의 존재를 모르고, 관리자만 Airtable에서 편하게 운영합니다.
