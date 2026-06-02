begin;

create or replace function public.search_collaboration_invite_profiles(
  p_query text,
  p_limit integer default 8
)
returns table (
  user_id uuid,
  username text,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select regexp_replace(regexp_replace(trim(coalesce(p_query, '')), '^@+', ''), '[^A-Za-z0-9_]', '', 'g') as query
  )
  select
    profiles.id as user_id,
    profiles.username,
    profiles.display_name
  from public.profiles
  cross join normalized
  where (select auth.uid()) is not null
    and profiles.id <> (select auth.uid())
    and profiles.username is not null
    and char_length(normalized.query) > 0
    and lower(profiles.username) like lower(normalized.query) || '%'
  order by
    lower(profiles.username) = lower(normalized.query) desc,
    lower(profiles.username) asc
  limit greatest(1, least(coalesce(p_limit, 8), 12));
$$;

revoke execute on function public.search_collaboration_invite_profiles(text, integer) from public;
revoke execute on function public.search_collaboration_invite_profiles(text, integer) from anon;
grant execute on function public.search_collaboration_invite_profiles(text, integer) to authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
