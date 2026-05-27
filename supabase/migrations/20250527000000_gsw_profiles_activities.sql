-- GSW 연동 프로필 + 강의 활동(안내·평가·시험)

-- 1. 사용자 프로필 (GSW 계정 매핑)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  department text,
  gsw_user_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_gsw_user_id on public.profiles(gsw_user_id);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- 2. 코스 소개·활동 (안내 / 만족도·평가 / 시험)
create table if not exists public.course_activities (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  activity_type text not null check (activity_type in ('guide', 'evaluation', 'exam')),
  title text not null,
  description text,
  config jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_required boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_course_activities_course on public.course_activities(course_id);

alter table public.course_activities enable row level security;

create policy "course_activities_select" on public.course_activities
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_activities.course_id and c.is_published = true
    )
  );

-- 3. 활동 제출 (평가·시험·안내 확인)
create table if not exists public.activity_submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  activity_id uuid references public.course_activities(id) on delete cascade not null,
  answers jsonb not null default '{}'::jsonb,
  score numeric,
  passed boolean,
  submitted_at timestamptz default now(),
  unique(user_id, activity_id)
);

create index if not exists idx_activity_submissions_user on public.activity_submissions(user_id);

alter table public.activity_submissions enable row level security;

create policy "activity_submissions_select_own" on public.activity_submissions
  for select using (auth.uid() = user_id);

create policy "activity_submissions_insert_own" on public.activity_submissions
  for insert with check (auth.uid() = user_id);

create policy "activity_submissions_update_own" on public.activity_submissions
  for update using (auth.uid() = user_id);

-- 4. 코스 학습 현황 (레슨 + 활동)
create or replace function public.get_course_learning_status(p_course_id uuid)
returns table (
  total_lessons bigint,
  completed_lessons bigint,
  total_required_activities bigint,
  completed_required_activities bigint,
  lessons_complete boolean,
  activities_complete boolean,
  course_complete boolean
)
language sql
security definer
set search_path = public
as $$
  with lesson_stats as (
    select
      count(l.id) as total_lessons,
      count(up.id) filter (where up.is_completed = true) as completed_lessons
    from public.lessons l
    left join public.user_progress up
      on up.lesson_id = l.id and up.user_id = auth.uid()
    where l.course_id = p_course_id
  ),
  activity_stats as (
    select
      count(a.id) filter (where a.is_required) as total_required_activities,
      count(s.id) filter (
        where a.is_required
          and (
            (a.activity_type = 'guide' and coalesce((s.answers->>'acknowledged')::boolean, false))
            or (a.activity_type in ('evaluation', 'exam') and s.passed = true)
          )
      ) as completed_required_activities
    from public.course_activities a
    left join public.activity_submissions s
      on s.activity_id = a.id and s.user_id = auth.uid()
    where a.course_id = p_course_id
  )
  select
    ls.total_lessons,
    ls.completed_lessons,
    coalesce(ast.total_required_activities, 0),
    coalesce(ast.completed_required_activities, 0),
    ls.total_lessons > 0 and ls.completed_lessons >= ls.total_lessons as lessons_complete,
    coalesce(ast.total_required_activities, 0) = 0
      or coalesce(ast.completed_required_activities, 0) >= coalesce(ast.total_required_activities, 0)
      as activities_complete,
    (ls.total_lessons > 0 and ls.completed_lessons >= ls.total_lessons)
      and (
        coalesce(ast.total_required_activities, 0) = 0
        or coalesce(ast.completed_required_activities, 0) >= coalesce(ast.total_required_activities, 0)
      ) as course_complete
  from lesson_stats ls
  cross join activity_stats ast;
$$;

grant execute on function public.get_course_learning_status(uuid) to authenticated;
