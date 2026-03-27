# LMS 학습관리시스템

YouTube + Supabase 기반 무료 온라인 강의 학습 관리 플랫폼

## 기술 스택

- **프론트엔드**: Next.js 15 (App Router, Turbopack)
- **스타일링**: Tailwind CSS + Pretendard 폰트
- **백엔드/DB**: Supabase (PostgreSQL + Auth + Storage)
- **영상 호스팅**: YouTube (Unlisted / IFrame API)
- **배포**: Vercel (무료)

## 주요 기능

- 📚 강의 목록 / 수강 신청
- ▶️ YouTube 임베드 플레이어 + 실시간 진도 추적
- 📊 수강생 대시보드 (개인 진도율)
- ⚙️ 관리자 대시보드 (전체 수강생 진도 현황)
- 📱 PC / 모바일 반응형 UI

## 설치 및 실행

### 1. Supabase 프로젝트 · 스키마

**방법 A — 대시보드에서 수동**

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행 (또는 `supabase/migrations`의 최신 마이그레이션과 동일한 내용)
3. Settings → API에서 URL과 anon / service_role 키 복사

**방법 B — Supabase CLI (마이그레이션)**

프로젝트를 연결한 뒤 `supabase db push`로 `supabase/migrations`를 원격 DB에 반영합니다. (로컬에는 `supabase link` 후 사용)

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 최소 다음 값을 채웁니다.

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_ADMIN_EMAIL=실제-관리자-이메일
SYNC_API_KEY=임의-문자열
NEXT_PUBLIC_SYNC_API_KEY=위와-동일
CRON_SECRET=임의-문자열
```

Vercel에 배포할 때도 동일한 키를 Environment Variables에 등록하고, **Cron용 `CRON_SECRET`**은 Vercel 프로젝트 설정의 CRON_SECRET과 맞춥니다.

### 3. 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속

### 4. GitHub 저장소 · Vercel 배포

**GitHub (CLI 예시)**

```bash
git init
git add .
git commit -m "Initial commit"
gh auth login
gh repo create <저장소이름> --public --source=. --remote=origin --push
```

**Vercel**

```bash
vercel login
cd <프로젝트-루트>
vercel link   # 새 프로젝트 생성 또는 기존 프로젝트 연결
vercel env pull .env.local   # 선택: 원격 환경변수 동기화
vercel --prod
```

또는 GitHub 저장소를 Vercel 대시보드에서 Import한 뒤, **Settings → Environment Variables**에 `.env.local`과 동일한 값을 등록합니다. `vercel.json`의 Cron은 `/api/sync/airtable`를 호출하며, 인증은 **`Authorization: Bearer CRON_SECRET`**(Vercel이 Cron 요청에 자동 부여) 또는 수동 호출 시 `x-sync-key` / `SYNC_API_KEY`를 사용합니다.

## 강의 등록 방법

1. YouTube에 영상 업로드 → 공개 설정을 **"일부 공개(Unlisted)"**로 설정
2. 영상 URL에서 YouTube ID 확인 (예: `youtube.com/watch?v=ABC123` → `ABC123`)
3. Supabase 대시보드 → Table Editor에서:
   - `courses` 테이블에 강의 추가 (`is_published = true` 설정)
   - `lessons` 테이블에 각 챕터 추가 (`youtube_id`, `duration_seconds`, `sort_order` 입력)

### 샘플 데이터 입력 예시 (SQL)

```sql
-- 강의 등록
INSERT INTO courses (title, description, is_published, sort_order) VALUES
  ('전기차 기초 이론', '전기차의 기본 구조와 작동 원리를 학습합니다.', true, 1);

-- 레슨 등록 (youtube_id는 실제 영상 ID로 교체)
INSERT INTO lessons (course_id, title, youtube_id, duration_seconds, sort_order) VALUES
  ((SELECT id FROM courses WHERE title = '전기차 기초 이론'), '1강. 전기차란 무엇인가', 'YOUR_YOUTUBE_ID', 600, 1),
  ((SELECT id FROM courses WHERE title = '전기차 기초 이론'), '2강. 모터의 종류와 특성', 'YOUR_YOUTUBE_ID', 900, 2),
  ((SELECT id FROM courses WHERE title = '전기차 기초 이론'), '3강. 전력 변환 장치', 'YOUR_YOUTUBE_ID', 750, 3);
```

## 진도율 추적 방식

- YouTube IFrame API로 재생 상태를 실시간 감지
- 30초마다 시청 위치를 Supabase에 자동 저장
- 영상의 **90% 이상 시청** 시 자동으로 수강 완료 처리
- ⚠️ LMS 사이트 내에서 시청해야만 진도율이 기록됨

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx           # 로그인/회원가입
│   ├── layout.tsx         # 루트 레이아웃
│   ├── globals.css        # 글로벌 스타일
│   ├── dashboard/
│   │   └── page.tsx       # 수강생 대시보드
│   ├── courses/
│   │   └── page.tsx       # 전체 강의 목록
│   ├── course/[id]/
│   │   └── page.tsx       # 강의 상세 (레슨 목록)
│   ├── lesson/[id]/
│   │   └── page.tsx       # 레슨 영상 플레이어
│   └── admin/
│       └── page.tsx       # 관리자 대시보드
├── components/
│   ├── Navbar.tsx         # 네비게이션 (PC+모바일)
│   └── YouTubePlayer.tsx  # YouTube 플레이어 + 진도 추적
├── lib/
│   ├── supabase.ts        # Supabase 클라이언트
│   └── types.ts           # TypeScript 타입
supabase/
└── schema.sql             # DB 스키마 + RLS + 함수
```

## 향후 확장

- [ ] 관리자 강의/레슨 CRUD UI (현재는 Supabase 대시보드에서 직접 입력)
- [ ] Bunny.net Stream 전환 (콘텐츠 보호 필요 시)
- [ ] 수강생 북마크 + 타임스탬프 메모
- [ ] 수료증 자동 발급
- [ ] 이어보기 팝업 알림
