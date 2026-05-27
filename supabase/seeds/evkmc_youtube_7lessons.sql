-- EVKMC_LMS YouTube 1~7강 → Supabase 등록
-- 실행 전: 아래 YOUTUBE_ID_1 ~ YOUTUBE_ID_7 을 Studio URL의 11자리 ID로 교체하세요.

-- 강의 2개
INSERT INTO public.courses (id, title, description, thumbnail_url, is_published, sort_order)
VALUES
  (
    '33333333-1111-1111-1111-111111111111',
    '친환경차 기본원리 이해하기',
    'EVKMC 전기차 AS 교육 — 친환경차(전기차·하이브리드·수소 등) 기본 개념과 구성을 학습합니다.',
    'https://images.unsplash.com/photo-1593941707882-a5bac983da8a?w=800&auto=format&fit=crop',
    true,
    1
  ),
  (
    '33333333-2222-2222-2222-222222222222',
    '고전압 안전교육',
    'EVKMC 전기차 AS 교육 — 고전압 시스템 작업·안전 절차·보호 장비를 학습합니다.',
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&auto=format&fit=crop',
    true,
    2
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

-- 레슨 7개 (lesson_type video)
INSERT INTO public.lessons (
  id, course_id, title, lesson_type, youtube_id, duration_seconds, sort_order, is_free
)
VALUES
  ('33333333-1001-1001-1001-100110011001', '33333333-1111-1111-1111-111111111111', '1강. 친환경차 기본원리 이해하기', 'video', 'OzxQl_Qo89k', 1363, 1, false),
  ('33333333-1002-1002-1002-100210021002', '33333333-1111-1111-1111-111111111111', '2강. 친환경차 기본원리 이해하기', 'video', 'b4Pq9YOyRdM', 1138, 2, false),
  ('33333333-1003-1003-1003-100310031003', '33333333-1111-1111-1111-111111111111', '3강. 친환경차 기본원리 이해하기', 'video', 'pvfTWbIXQ18', 1194, 3, false),
  ('33333333-1004-1004-1004-100410041004', '33333333-2222-2222-2222-222222222222', '4강. 고전압 안전교육', 'video', 'OUlk9rd7Ujc', 2626, 1, false),
  ('33333333-1005-1005-1005-100510051005', '33333333-2222-2222-2222-222222222222', '5강. 고전압 안전교육', 'video', 'GoscHgddqSo', 1886, 2, false),
  ('33333333-1006-1006-1006-100610061006', '33333333-2222-2222-2222-222222222222', '6강. 고전압 안전교육', 'video', 'SzTt6Ui0X_I', 1884, 3, false),
  ('33333333-1007-1007-1007-100710071007', '33333333-2222-2222-2222-222222222222', '7강. 고전압 안전교육', 'video', 'jcRfuJNobwU', 2177, 4, false)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  lesson_type = EXCLUDED.lesson_type,
  youtube_id = EXCLUDED.youtube_id,
  duration_seconds = EXCLUDED.duration_seconds,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free;
