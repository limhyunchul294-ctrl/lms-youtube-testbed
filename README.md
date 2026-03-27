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

**Vercel (CLI)**

1. **CLI 설치** (전역 또는 프로젝트마다 `npx` 사용)

   ```bash
   npm i -g vercel
   # 또는: npx vercel@latest
   ```

2. **로그인**

   - **방법 A — 대화형** (권장)

     ```bash
     vercel login
     ```

     이메일 또는 GitHub로 로그인합니다.

   - **방법 B — 토큰** (`vercel login`이 실패하거나 CI/스크립트용)

     1. [Vercel → Account → Tokens](https://vercel.com/account/tokens)에서 **Create Token**으로 토큰 발급
     2. 터미널에서 환경변수로 넣고 동일 세션에서 CLI 실행

        **PowerShell**

        ```powershell
        $env:VERCEL_TOKEN = "여기에_발급한_토큰"
        vercel whoami
        ```

        **cmd / bash**

        ```bash
        set VERCEL_TOKEN=여기에_발급한_토큰
        vercel whoami
        ```

     토큰이 유효하면 `vercel whoami`에 계정이 표시됩니다. 토큰은 저장소에 커밋하지 마세요.

3. **프로젝트 연결·배포** (저장소 루트에서)

   ```bash
   cd <프로젝트-루트>
   vercel link          # 팀·프로젝트 선택 (최초 1회). 새 Vercel 프로젝트 생성 가능
   vercel               # 프리뷰 배포
   vercel --prod        # 프로덕션 배포
   ```

4. **환경 변수**

   - **대시보드**: Project → **Settings → Environment Variables**에 `.env.local`과 같은 이름·값을 등록 (Production / Preview / Development 필요 시 구분).
   - **CLI로 추가** (예: Production에만):

     ```bash
     vercel env add NEXT_PUBLIC_SUPABASE_URL production
     ```

     여러 개는 반복 입력하거나, 대시보드에서 한 번에 붙여넣는 편이 빠를 수 있습니다.

   - 로컬로 내려받기 (선택):

     ```bash
     vercel env pull .env.local
     ```

5. **Cron / 동기화 API**

   `vercel.json`의 Cron은 `POST /api/sync/airtable`를 호출합니다. 인증은 Vercel이 부여하는 **`Authorization: Bearer CRON_SECRET`**(프로젝트 **Settings → Environment Variables**에 `CRON_SECRET` 등록) 또는 수동 호출 시 헤더 `x-sync-key`(값은 `SYNC_API_KEY`)입니다.

GitHub만 연결해 두고 Vercel은 CLI만 쓰는 경우에도 위 순서로 배포하면 됩니다. 대시보드에서 **Import Git Repository**를 쓰지 않아도 `vercel link` + `vercel --prod`로 동일하게 배포할 수 있습니다.

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
