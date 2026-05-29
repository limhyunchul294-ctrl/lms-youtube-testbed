# LMS 최소 참고 아키텍처 (2코스 규모)

Moodle / Open edX / Frappe LMS에서 **필수 패턴만** 가져온 EVKMC LMS 구조입니다.  
대규모 플러그인·SCORM 창고는 제외하고, **코스 → 단계 → 레슨 → 활동**과 **완료 규칙**을 코드로 고정합니다.

## 계층

```
content/evkmc-youtube-catalog.json   ← 콘텐츠 카탈로그(목표·모듈 메타)
src/lib/lms/                       ← 도메인 규칙(단일 진실)
  rules.ts                         ← 완료 90%, 4단계 순서
  submissions.ts                   ← 활동 제출 → 완료 집합
  learning-path.ts                 ← 로드맵·다음 행동·게이트
  catalog.ts                       ← 카탈로그 조회
Supabase                           ← courses, lessons, enrollments, user_progress, course_activities
src/app/course|lesson|activity     ← UI (lms 라이브러리 사용)
```

## 학습 경로 (4단계)

| 순서 | 단계 | DB | 완료 조건 |
|------|------|-----|-----------|
| 1 | 강의 안내 | `course_activities` (guide) | `answers.acknowledged` |
| 2 | 영상 수강 | `lessons` + `user_progress` | 시청/슬라이드 **90%** (`LMS_COMPLETION_RATIO`) |
| 3 | 만족도 평가 | evaluation | `passed = true` |
| 4 | 온라인 시험 | exam | `passed = true` |

RPC `get_course_learning_status`가 코스 수료 여부를 집계합니다.

## 카탈로그 vs 런타임 DB

- **카탈로그 JSON**: 학습 목표, 모듈 구획, YouTube ID (시드 입력용)
- **Supabase**: 실제 수강·진도·제출 (런타임)

새 강의 추가 시: catalog 수정 → `seed-evkmc` / `seed-evkmc-activities` → (선택) `import-exam-questions`

## UI 계약

- **코스 허브**: `buildLearningSteps` + `CourseLearningPath` + `resolveNextStep`
- **레슨**: `resolveLessonNextAction` + `LessonCatalogMeta`
- **활동**: `checkActivityAccess` + `resolveActivityNextAction`

## 확장 시 (코스 늘릴 때)

1. `content/evkmc-youtube-catalog.json`에 코스·레슨·`learning_modules` 추가  
2. `src/data/evkmc-activities.ts` / exam bank에 활동·문항 추가  
3. `EVKMC_COURSE_ID_LIST` (gsw-bridge 자동 수강) 갱신  
4. `src/lib/lms` 규칙은 **변경 없이** 재사용  

## 참고 OSS 매핑

| OSS 개념 | EVKMC LMS |
|----------|-----------|
| Course | `courses` |
| Section / Module | `learning_modules` (카탈로그, 논리 단위) |
| Unit / Lesson | `lessons` |
| Quiz / Survey | `course_activities` (exam / evaluation) |
| Completion tracking | `user_progress` + `activity_submissions` |
| Learning pathway | `src/lib/lms/learning-path.ts` |
