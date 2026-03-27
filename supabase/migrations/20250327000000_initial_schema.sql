-- =============================================
-- LMS 스키마 (Supabase SQL Editor에서 실행)
-- =============================================

-- 1. 강의 테이블
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  thumbnail_url text,
  is_published boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 2. 레슨(챕터) 테이블
create table public.lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  youtube_id text not null,
  duration_seconds int default 0,
  sort_order int default 0,
  is_free boolean default false,
  created_at timestamptz default now()
);

-- 3. 수강 등록 테이블
create table public.enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

-- 4. 진도율 추적 테이블
create table public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  watched_seconds int default 0,
  is_completed boolean default false,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

-- 5. 인덱스
create index idx_lessons_course on public.lessons(course_id);
create index idx_enrollments_user on public.enrollments(user_id);
create index idx_progress_user on public.user_progress(user_id);
create index idx_progress_lesson on public.user_progress(lesson_id);

-- 6. RLS (Row Level Security) 정책
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.user_progress enable row level security;

-- 강의/레슨: 누구나 공개된 것 조회 가능
create policy "courses_select" on public.courses
  for select using (is_published = true);

create policy "lessons_select" on public.lessons
  for select using (
    exists (
      select 1 from public.courses
      where courses.id = lessons.course_id and courses.is_published = true
    )
  );

-- 수강등록: 본인 것만 조회/생성
create policy "enrollments_select" on public.enrollments
  for select using (auth.uid() = user_id);

create policy "enrollments_insert" on public.enrollments
  for insert with check (auth.uid() = user_id);

-- 진도율: 본인 것만 조회/생성/수정
create policy "progress_select" on public.user_progress
  for select using (auth.uid() = user_id);

create policy "progress_insert" on public.user_progress
  for insert with check (auth.uid() = user_id);

create policy "progress_update" on public.user_progress
  for update using (auth.uid() = user_id);

-- 7. 관리자용: 전체 진도 조회 함수
create or replace function public.get_all_progress()
returns table (
  user_email text,
  course_title text,
  total_lessons bigint,
  completed_lessons bigint,
  progress_pct numeric
)
language sql
security definer
as $$
  select
    u.email as user_email,
    c.title as course_title,
    count(l.id) as total_lessons,
    count(up.id) filter (where up.is_completed = true) as completed_lessons,
    round(
      count(up.id) filter (where up.is_completed = true)::numeric
      / nullif(count(l.id), 0) * 100, 1
    ) as progress_pct
  from public.enrollments e
  join auth.users u on u.id = e.user_id
  join public.courses c on c.id = e.course_id
  join public.lessons l on l.course_id = c.id
  left join public.user_progress up on up.lesson_id = l.id and up.user_id = e.user_id
  group by u.email, c.title
  order by u.email, c.title;
$$;

-- 8. 개인 진도율 조회 함수
create or replace function public.get_my_course_progress(p_course_id uuid)
returns table (
  lesson_id uuid,
  lesson_title text,
  youtube_id text,
  duration_seconds int,
  sort_order int,
  watched_seconds int,
  is_completed boolean
)
language sql
security definer
as $$
  select
    l.id as lesson_id,
    l.title as lesson_title,
    l.youtube_id,
    l.duration_seconds,
    l.sort_order,
    coalesce(up.watched_seconds, 0) as watched_seconds,
    coalesce(up.is_completed, false) as is_completed
  from public.lessons l
  left join public.user_progress up on up.lesson_id = l.id and up.user_id = auth.uid()
  where l.course_id = p_course_id
  order by l.sort_order;
$$;

-- 9. 샘플 데이터 (필요시 실행)
-- insert into public.courses (title, description, is_published, sort_order) values
--   ('전기차 기초 이론', '전기차의 기본 구조와 작동 원리를 학습합니다.', true, 1),
--   ('배터리 시스템', '고전압 배터리의 구조와 관리 방법을 배웁니다.', true, 2);
--
-- insert into public.lessons (course_id, title, youtube_id, duration_seconds, sort_order) values
--   ((select id from courses where title = '전기차 기초 이론'), '1강. 전기차란 무엇인가', 'dQw4w9WgXcQ', 600, 1),
--   ((select id from courses where title = '전기차 기초 이론'), '2강. 모터의 종류와 특성', 'dQw4w9WgXcQ', 900, 2),
--   ((select id from courses where title = '전기차 기초 이론'), '3강. 전력 변환 장치', 'dQw4w9WgXcQ', 750, 3);
