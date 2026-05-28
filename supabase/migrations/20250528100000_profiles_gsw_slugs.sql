-- GSW 프로필 확장 + 공개 slug (UUID 대신 짧은 텍스트/불투명 코드)

alter table public.profiles
  add column if not exists employee_no text,
  add column if not exists position text,
  add column if not exists company text;

alter table public.courses
  add column if not exists slug text;

alter table public.lessons
  add column if not exists slug text;

alter table public.course_activities
  add column if not exists slug text;

create unique index if not exists idx_courses_slug on public.courses(slug) where slug is not null;
create unique index if not exists idx_lessons_slug on public.lessons(slug) where slug is not null;
create unique index if not exists idx_course_activities_slug on public.course_activities(slug) where slug is not null;

-- EVKMC 코스 (의미 있는 짧은 텍스트, 순번 아님)
update public.courses set slug = 'evkmc-eco' where id = '33333333-1111-1111-1111-111111111111';
update public.courses set slug = 'evkmc-hv' where id = '33333333-2222-2222-2222-222222222222';

-- 레슨 (코스 접두 + 불투명 8자 — 순번 노출 없음)
update public.lessons set slug = 'eco-vkmc7k2m' where id = '33333333-1001-1001-1001-100110011001';
update public.lessons set slug = 'eco-vkmc9p4n' where id = '33333333-1002-1002-1002-100210021002';
update public.lessons set slug = 'eco-vkmc3q8r' where id = '33333333-1003-1003-1003-100310031003';
update public.lessons set slug = 'hv-vkmc2w5x' where id = '33333333-1004-1004-1004-100410041004';
update public.lessons set slug = 'hv-vkmc6j1t' where id = '33333333-1005-1005-1005-100510051005';
update public.lessons set slug = 'hv-vkmc4h9z' where id = '33333333-1006-1006-1006-100610061006';
update public.lessons set slug = 'hv-vkmc8f3c' where id = '33333333-1007-1007-1007-100710071007';

-- 활동
update public.course_activities set slug = 'eco-guide' where id = '33333333-a001-4000-8000-000000000001';
update public.course_activities set slug = 'eco-feedback' where id = '33333333-a001-4000-8000-000000000002';
update public.course_activities set slug = 'eco-assess' where id = '33333333-a001-4000-8000-000000000003';
update public.course_activities set slug = 'hv-guide' where id = '33333333-a002-4000-8000-000000000004';
update public.course_activities set slug = 'hv-feedback' where id = '33333333-a002-4000-8000-000000000005';
update public.course_activities set slug = 'hv-assess' where id = '33333333-a002-4000-8000-000000000006';

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
