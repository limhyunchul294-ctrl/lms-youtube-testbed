-- 관리자용 학습 성과 집계 (완주·시험 합격·재응시·평균 점수)

create or replace function public.get_learning_outcomes()
returns table (
  course_id uuid,
  course_title text,
  enrolled_count bigint,
  course_complete_count bigint,
  completion_rate numeric,
  exam_submit_count bigint,
  exam_pass_count bigint,
  exam_pass_rate numeric,
  exam_retry_count bigint,
  exam_avg_score numeric
)
language sql
security definer
set search_path = public
as $$
  with per_user_course as (
    select
      e.user_id,
      e.course_id,
      c.title as course_title,
      (select count(*)::bigint from public.lessons l where l.course_id = e.course_id) as total_lessons,
      (
        select count(*)::bigint
        from public.user_progress up
        join public.lessons l on l.id = up.lesson_id
        where l.course_id = e.course_id
          and up.user_id = e.user_id
          and up.is_completed = true
      ) as completed_lessons,
      (
        select count(*)::bigint
        from public.course_activities a
        where a.course_id = e.course_id and a.is_required
      ) as total_req_act,
      (
        select count(*)::bigint
        from public.course_activities a
        join public.activity_submissions s
          on s.activity_id = a.id and s.user_id = e.user_id
        where a.course_id = e.course_id
          and a.is_required
          and (
            (a.activity_type = 'guide' and coalesce((s.answers->>'acknowledged')::boolean, false))
            or (a.activity_type in ('evaluation', 'exam') and s.passed = true)
          )
      ) as completed_req_act
    from public.enrollments e
    join public.courses c on c.id = e.course_id
  ),
  completion as (
    select
      course_id,
      course_title,
      count(*)::bigint as enrolled_count,
      count(*) filter (
        where total_lessons > 0
          and completed_lessons >= total_lessons
          and (total_req_act = 0 or completed_req_act >= total_req_act)
      )::bigint as course_complete_count
    from per_user_course
    group by course_id, course_title
  ),
  exam_agg as (
    select
      a.course_id,
      count(s.id)::bigint as exam_submit_count,
      count(s.id) filter (where s.passed = true)::bigint as exam_pass_count,
      round(avg(s.score), 1) as exam_avg_score,
      count(s.id) filter (
        where coalesce((s.answers->>'attempt_count')::int, 1) > 1
      )::bigint as exam_retry_count
    from public.course_activities a
    left join public.activity_submissions s on s.activity_id = a.id
    where a.activity_type = 'exam'
    group by a.course_id
  )
  select
    c.course_id,
    c.course_title,
    c.enrolled_count,
    c.course_complete_count,
    round(c.course_complete_count::numeric / nullif(c.enrolled_count, 0) * 100, 1) as completion_rate,
    coalesce(e.exam_submit_count, 0),
    coalesce(e.exam_pass_count, 0),
    round(coalesce(e.exam_pass_count, 0)::numeric / nullif(e.exam_submit_count, 0) * 100, 1) as exam_pass_rate,
    coalesce(e.exam_retry_count, 0),
    coalesce(e.exam_avg_score, 0)
  from completion c
  left join exam_agg e on e.course_id = c.course_id
  order by c.course_title;
$$;

grant execute on function public.get_learning_outcomes() to authenticated;
