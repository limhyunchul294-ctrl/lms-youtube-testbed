-- GSW 포털 «내 정보»와 동기화할 프로필 필드

alter table public.profiles
  add column if not exists gsw_username text,
  add column if not exists phone text,
  add column if not exists gsw_role text,
  add column if not exists gsw_grade text;
