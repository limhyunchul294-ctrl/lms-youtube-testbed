# LMS 개선 실행 TODO (토의 결과 반영)

최종 업데이트: 2026-05-28

## 목표
- UX/UI와 백엔드 운영 안정성을 함께 개선한다.
- 보안/운영 리스크를 먼저 낮춘 뒤, 학습효과 개선 작업을 단계적으로 진행한다.

## 우선순위 실행안

### P0 (즉시, 운영/보안)
- [x] 관리자 API 인증을 공개 키 방식에서 세션 기반 검증으로 전환
  - 반영: `src/lib/admin-auth.ts`
  - 반영: `src/app/api/admin/*`, `src/app/api/sync/airtable/route.ts`
- [x] 관리자 화면에서 `x-sync-key` 헤더 사용 제거
  - 반영: `src/app/admin/page.tsx`, `src/app/admin/activities/page.tsx`
- [x] DB 스키마 운영 정책 문서화 (migrations 중심)
  - 반영: `docs/DB_SCHEMA_POLICY.md`

### P1 (단기, UX 명확성/운영 효율)
- [x] 코스/레슨/활동 화면에 "다음 행동(Next Action)" 배너 추가
  - 반영: `src/components/course/NextActionBanner.tsx`
  - 반영: `src/app/course/[id]/page.tsx`
  - 반영: `src/app/lesson/[id]/page.tsx`
  - 반영: `src/app/activity/[id]/page.tsx`
- [ ] 활동 config 저장 시 서버 스키마 검증 도입 (JSON Schema 또는 Zod)
- [ ] 관리자 활동 목록 검색/필터(코스/유형/키워드) 추가

### P2 (중기, 학습 효과 강화)
- [ ] 현업 시나리오형 학습카드 템플릿 도입 (증상-진단-조치)
- [ ] 시험 문항을 암기형 중심에서 사례판단형 비중 확대
- [ ] 학습 성과 대시보드(완주율/정답률/재시도률) 확장

## 진행 규칙
- 모든 DB 구조 변경은 반드시 `supabase/migrations/*.sql`로 관리한다.
- 정책/권한 변경은 기능 개발보다 우선한다.
- UI 변경은 "다음 행동 명확화"를 우선 기준으로 평가한다.

## 완료 기준 (Definition of Done)
- 기능 구현 + 빌드 통과 + 운영 문서 갱신
- 관리자/수강생 주요 흐름에서 회귀 없음
- 보안상 공개 키 의존 제거 상태 유지

