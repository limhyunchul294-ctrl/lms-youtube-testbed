-- 슬라이드형 레슨 + 진도 확장

alter table public.lessons
  add column if not exists lesson_type text not null default 'video'
    check (lesson_type in ('video', 'slides'));

alter table public.lessons
  add column if not exists slides jsonb default null;

alter table public.user_progress
  add column if not exists last_slide_index int not null default 0;

comment on column public.lessons.lesson_type is 'video | slides';
comment on column public.lessons.slides is '[{ "image_url", "title?", "caption?" }]';
comment on column public.user_progress.last_slide_index is 'slides 레슨: 마지막으로 본 슬라이드 index (0-based)';

-- 개인 진도 RPC: 슬라이드 메타 포함
drop function if exists public.get_my_course_progress(uuid);

create or replace function public.get_my_course_progress(p_course_id uuid)
returns table (
  lesson_id uuid,
  lesson_title text,
  lesson_type text,
  youtube_id text,
  duration_seconds int,
  sort_order int,
  slide_count int,
  watched_seconds int,
  last_slide_index int,
  is_completed boolean
)
language sql
security definer
as $$
  select
    l.id as lesson_id,
    l.title as lesson_title,
    l.lesson_type,
    l.youtube_id,
    l.duration_seconds,
    l.sort_order,
    case
      when l.lesson_type = 'slides' and l.slides is not null
      then jsonb_array_length(l.slides)
      else 0
    end::int as slide_count,
    coalesce(up.watched_seconds, 0) as watched_seconds,
    coalesce(up.last_slide_index, 0) as last_slide_index,
    coalesce(up.is_completed, false) as is_completed
  from public.lessons l
  left join public.user_progress up
    on up.lesson_id = l.id and up.user_id = auth.uid()
  where l.course_id = p_course_id
  order by l.sort_order;
$$;
