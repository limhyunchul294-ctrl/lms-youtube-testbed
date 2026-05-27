# 시험·설문 문항 Import 가이드

## 현재 방식

| 방법 | 설명 |
|------|------|
| **관리자 UI** | `/admin/activities` → «친환경차 30문항» / «고전압 60문항» 버튼 |
| **API** | `POST /api/admin/import-exam-questions` |
| **수동 JSON** | 활동 선택 후 config textarea 편집 → 저장 |

docx 파일은 저장소에 없을 수 있습니다. Word에서 문항을 정리한 뒤 아래 JSON 형식으로 변환해 붙여넣으세요.

## API 예시

```bash
# 문항 은행으로 30제 / 60제 자동 생성
curl -X POST "https://lms-youtube-testbed.vercel.app/api/admin/import-exam-questions" \
  -H "Content-Type: application/json" \
  -H "x-sync-key: YOUR_SYNC_API_KEY" \
  -d "{\"course_id\":\"33333333-1111-1111-1111-111111111111\",\"use_bank\":true,\"question_count\":30}"

curl -X POST "https://lms-youtube-testbed.vercel.app/api/admin/import-exam-questions" \
  -H "Content-Type: application/json" \
  -H "x-sync-key: YOUR_SYNC_API_KEY" \
  -d "{\"course_id\":\"33333333-2222-2222-2222-222222222222\",\"use_bank\":true,\"question_count\":60}"
```

## 커스텀 문항 JSON

```json
{
  "course_id": "33333333-1111-1111-1111-111111111111",
  "pass_score": 70,
  "questions": [
    {
      "id": "q1",
      "label": "문항 내용",
      "options": ["보기1", "보기2", "보기3", "보기4"],
      "correct": 1
    }
  ]
}
```

`correct`는 **0부터 시작**하는 정답 보기 인덱스입니다.

## 만족도 평가 (evaluation)

`activity_type: evaluation` 의 config 예:

```json
{
  "questions": [
    { "id": "overall", "label": "전체 만족도", "type": "rating", "max": 5 },
    { "id": "comment", "label": "의견", "type": "text", "optional": true }
  ]
}
```

## 코드 위치

- 문항 은행: `src/data/evkmc-exam-banks.ts`
- Import API: `src/app/api/admin/import-exam-questions/route.ts`
- 활동 편집 API: `src/app/api/admin/upsert-activity/route.ts`
