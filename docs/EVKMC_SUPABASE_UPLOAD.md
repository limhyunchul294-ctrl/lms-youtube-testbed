# EVKMC YouTube 1~7강 → Supabase 등록 가이드

채널 **EVKMC_LMS** 에 업로드한 7개 영상을 LMS DB에 맞춘 구조입니다.

## 코스·레슨 구조

| 강의 코스 | 레슨 | Studio 제목 요약 | 길이 | `duration_seconds` |
|-----------|------|------------------|------|---------------------|
| **친환경차 기본원리** | 1강 | 친환경차 기본원리 | 22:43 | 1363 |
| | 2강 | 친환경차 기본원리 | 18:58 | 1138 |
| | 3강 | 친환경차 기본원리 | 19:54 | 1194 |
| **고전압 안전교육** | 4강 | 고전압 안전교육 | 43:46 | 2626 |
| | 5강 | 고전압 안전교육 | 31:26 | 1886 |
| | 6강 | 고전압 안전교육 | 31:24 | 1884 |
| | 7강 | 고전압 안전교육 | 36:17 | 2177 |

- 공개: **일부 공개(Unlisted)** — LMS 연동에 적합  
- 3·4·6강 Studio **저작권** 표시: 재생 테스트 시 LMS에서 한 번 확인  

### 고정 UUID (샘플 데이터와 분리)

| 구분 | UUID |
|------|------|
| 코스 친환경차 | `33333333-1111-1111-1111-111111111111` |
| 코스 고전압 | `33333333-2222-2222-2222-222222222222` |
| 레슨 1강~7강 | `33333333-1001-...` ~ `33333333-1007-...` (catalog JSON 참고) |

---

## 1단계: YouTube ID 7개 수집

Studio → **콘텐츠** → 각 영상 → **세부정보** 또는 **공유**

```text
https://www.youtube.com/watch?v=XXXXXXXXXXX
                              ^^^^^^^^^^^  ← 11자리만 사용
```

**순서:** 1강 → 2강 → … → 7강 (스크린샷 목록과 동일)

---

## 2단계: catalog JSON에 입력

파일: `content/evkmc-youtube-catalog.json`

각 레슨의 `"youtube_id": ""` 에 ID를 채웁니다.

---

## 3단계: Supabase 반영 (택 1)

### A) API (권장)

```bash
curl -X POST "https://lms-youtube-testbed.vercel.app/api/admin/seed-evkmc" \
  -H "Content-Type: application/json" \
  -H "x-sync-key: YOUR_SYNC_API_KEY" \
  -d "{\"youtube_ids\":[\"OzxQl_Qo89k\",\"b4Pq9YOyRdM\",\"pvfTWbIXQ18\",\"OUlk9rd7Ujc\",\"GoscHgddqSo\",\"SzTt6Ui0X_I\",\"jcRfuJNobwU\"]}"
```

로컬:

```bash
curl -X POST "http://localhost:3000/api/admin/seed-evkmc" \
  -H "Content-Type: application/json" \
  -H "x-sync-key: YOUR_SYNC_API_KEY" \
  -d "{\"youtube_ids\":[...]}"
```

### B) SQL Editor

`supabase/seeds/evkmc_youtube_7lessons.sql` — YouTube ID 반영 완료, SQL Editor에서 실행 가능.

### YouTube ID (반영 완료)

| 강 | `youtube_id` |
|----|----------------|
| 1강 | `OzxQl_Qo89k` |
| 2강 | `b4Pq9YOyRdM` |
| 3강 | `pvfTWbIXQ18` |
| 4강 | `OUlk9rd7Ujc` |
| 5강 | `GoscHgddqSo` |
| 6강 | `SzTt6Ui0X_I` |
| 7강 | `jcRfuJNobwU` |

---

## 4단계: LMS 확인

1. `/courses` — **친환경차 기본원리**, **고전압 안전교육** 2개 코스 노출  
2. 수강 신청 후 1강 재생·진도 저장  
3. `duration_seconds` 가 맞아야 90% 완료 판정이 정확함  

---

## 시험·설문 (다음 단계)

| docx | 연결 코스 |
|------|-----------|
| 친환경차 기본원리 시험 30제 | 친환경차 코스 수료 전 |
| 고전압 안전교육 시험 60제 | 고전압 코스 수료 전 |
| 만족도 설문 | 7강 완료 후 또는 전체 수료 후 |

문항 DB는 별도 모듈 예정 (`test, servey` 폴더 docx 기준).

---

## 관련 파일

| 파일 | 용도 |
|------|------|
| `content/evkmc-youtube-catalog.json` | 메타데이터·ID 목록 |
| `supabase/seeds/evkmc_youtube_7lessons.sql` | SQL 일괄 upsert |
| `src/app/api/admin/seed-evkmc/route.ts` | API 시드 |
