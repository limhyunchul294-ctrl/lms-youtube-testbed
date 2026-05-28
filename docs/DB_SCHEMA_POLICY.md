# DB Schema Sync Policy

## 원칙
- DB의 단일 진실 원천은 `supabase/migrations/*.sql` 입니다.
- `supabase/schema.sql`은 참고용이며, 수동 수정하지 않습니다.

## 변경 절차
1. 모든 스키마 변경은 새 마이그레이션 파일로 추가합니다.
2. 로컬/원격 반영 후 `schema.sql`을 최신 상태로 재생성합니다.
3. PR에는 "적용한 migration 파일명"과 "영향 테이블/함수"를 명시합니다.

## 점검 체크리스트
- RLS 정책 누락 여부
- 인덱스 추가 여부
- RPC/함수 권한(grant) 적용 여부
- 기존 데이터 마이그레이션(update/backfill) 포함 여부

## 운영 권고
- 문서형 스키마(`schema.sql`)가 실제와 불일치하면 장애 분석 시간이 크게 증가합니다.
- 배포 전 `migrations`와 `schema.sql` diff를 확인해 drift를 방지합니다.

