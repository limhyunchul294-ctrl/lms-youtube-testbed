# LMS UI·GSW 연동 로드맵

## 현재 구현 (이번 작업)

### 1차 — GSW 계정 → LMS 접속

| 항목 | 설명 |
|------|------|
| `POST /api/auth/gsw-bridge` | GSW가 발급한 HMAC 토큰으로 Supabase 세션 생성 |
| `/auth/gsw?token=...` | 포털 리다이렉트 수신 페이지 |
| `profiles` 테이블 | `gsw_user_id`, `display_name`, `department` 매핑 |
| `middleware.ts` | 보호 경로·`GSW_BRIDGE_ONLY` 시 포털 리다이렉트 |

**GSW 포털 연동 URL 예시**

```text
https://lms-youtube-testbed.vercel.app/auth/gsw?token={payload}.{signature}
```

**토큰 생성 (GSW 서버)** — `GSW_BRIDGE_SECRET` 공유:

```javascript
// payload: { email, name, gsw_user_id, department?, exp: unixSeconds }
// token = base64url(JSON) + '.' + base64url(HMAC-SHA256(secret, payloadB64))
```

개발 테스트: `GSW_BRIDGE_ALLOW_DEV=true` → `GET /api/auth/gsw-bridge?email=...`

### UI·학습 플로우

| 화면 | 경로 | 내용 |
|------|------|------|
| 로그인 | `/` | EVKMC 브랜드·GSW 포털 링크 |
| 내 학습 | `/dashboard` | 사이드바 레이아웃·수료 뱃지 |
| 강의 허브 | `/course/[id]` | 로드맵(안내→수강→평가→시험)·목차 |
| 활동 | `/activity/[id]` | 안내 확인·만족도·시험 |

### DB (마이그레이션 필요)

파일: `supabase/migrations/20250527000000_gsw_profiles_activities.sql`

- `profiles`, `course_activities`, `activity_submissions`
- RPC `get_course_learning_status`

**원격 적용 후** EVKMC 활동 시드:

```bash
curl -X POST "https://lms-youtube-testbed.vercel.app/api/admin/seed-evkmc-activities" \
  -H "x-sync-key: YOUR_SYNC_API_KEY"
```

---

## 환경 변수 (Vercel)

```env
# GSW 브릿지
GSW_BRIDGE_SECRET=포털과_공유하는_랜덤_문자열
GSW_BRIDGE_ONLY=false          # true면 이메일 로그인 숨김
GSW_BRIDGE_ALLOW_DEV=false     # true면 GET 데모 토큰 허용
NEXT_PUBLIC_GSW_PORTAL_URL=https://gsw.example.com
NEXT_PUBLIC_GSW_BRIDGE_ONLY=false
NEXT_PUBLIC_GSW_BRIDGE_ALLOW_DEV=false
```

---

## 2차 (진행·완료)

- [x] GSW 브릿지 + EVKMC 코스 자동 수강 신청
- [x] 동적 워터마크 (플레이어 오버레이)
- [x] 시험 문항 은행 + import API + 관리자 UI (`/admin/activities`)
- [x] 수료증 화면 (인쇄/PDF) `/course/[id]/certificate`
- [x] 데모 샘플 코스 목록에서 숨김
- [ ] docx → JSON 자동 변환 스크립트 (수동 JSON/API로 대체 가능)
- [ ] 수료 이메일 알림
- [ ] 기술문서 포털 «교육 센터» iframe vs 새 탭 정책 (GSW 팀)

---

## GSW 팀 체크리스트

1. `GSW_BRIDGE_SECRET` 합의·양쪽 env 등록
2. 포털 «교육 센터» 클릭 시 위 bridge URL로 redirect
3. 토큰 `exp` 5분 이내 권장
4. LMS 도메인 CORS/쿠키: 동일 사이트 또는 bridge만 사용
