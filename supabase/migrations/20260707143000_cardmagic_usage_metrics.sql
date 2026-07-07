create table if not exists public.cardmagic_screen_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_session_id uuid not null,
  screen_name text not null,
  screen_group text not null default 'screen',
  app_platform text,
  app_version text,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint cardmagic_screen_usage_events_screen_name_check
    check (length(btrim(screen_name)) between 1 and 120),
  constraint cardmagic_screen_usage_events_duration_check
    check (duration_seconds >= 0 and duration_seconds <= 43200),
  constraint cardmagic_screen_usage_events_time_check
    check (ended_at >= started_at)
);

create index if not exists cardmagic_screen_usage_events_started_idx
  on public.cardmagic_screen_usage_events (started_at desc);
create index if not exists cardmagic_screen_usage_events_user_started_idx
  on public.cardmagic_screen_usage_events (user_id, started_at desc);
create index if not exists cardmagic_screen_usage_events_session_started_idx
  on public.cardmagic_screen_usage_events (anonymous_session_id, started_at desc);
create index if not exists cardmagic_screen_usage_events_screen_started_idx
  on public.cardmagic_screen_usage_events (screen_name, started_at desc);
create index if not exists cardmagic_screen_usage_events_platform_started_idx
  on public.cardmagic_screen_usage_events (app_platform, started_at desc);

alter table public.cardmagic_screen_usage_events enable row level security;

create or replace function public.cardmagic_is_app_developer()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    lower(coalesce((auth.jwt() ->> 'email'), '')) = 'gtjoe51@gmail.com'
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'app_role', '')) in ('developer', 'internal_admin')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'is_app_developer', '')) in ('true', '1', 'yes');
$$;

create or replace function public.log_cardmagic_screen_usage(
  p_session_id uuid,
  p_screen_name text,
  p_screen_group text default 'screen',
  p_app_platform text default null,
  p_app_version text default null,
  p_started_at timestamptz default now(),
  p_ended_at timestamptz default now(),
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_duration_seconds integer;
  v_event_id uuid;
  v_screen_name text := nullif(btrim(p_screen_name), '');
begin
  if p_session_id is null then
    raise exception 'session_id is required';
  end if;

  if v_screen_name is null then
    raise exception 'screen_name is required';
  end if;

  if p_started_at is null or p_ended_at is null or p_ended_at < p_started_at then
    raise exception 'valid started_at and ended_at are required';
  end if;

  v_duration_seconds := least(
    43200,
    greatest(0, floor(extract(epoch from (p_ended_at - p_started_at)))::integer)
  );

  insert into public.cardmagic_screen_usage_events (
    user_id,
    anonymous_session_id,
    screen_name,
    screen_group,
    app_platform,
    app_version,
    started_at,
    ended_at,
    duration_seconds,
    metadata
  )
  values (
    v_user_id,
    p_session_id,
    left(v_screen_name, 120),
    coalesce(nullif(btrim(p_screen_group), ''), 'screen'),
    nullif(btrim(p_app_platform), ''),
    nullif(btrim(p_app_version), ''),
    p_started_at,
    p_ended_at,
    v_duration_seconds,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

create or replace function public.get_cardmagic_usage_dashboard(
  p_days integer default 14
)
returns table (
  row_kind text,
  label text,
  user_id uuid,
  screen_name text,
  duration_seconds bigint,
  event_count bigint,
  active_user_count bigint,
  active_day_count bigint,
  last_seen timestamptz,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 14), 1), 90);
  v_since timestamptz := now() - (v_days || ' days')::interval;
begin
  if not public.cardmagic_is_app_developer() then
    raise exception 'CardMagic developer access is required';
  end if;

  return query
  with scoped as (
    select *
    from public.cardmagic_screen_usage_events e
    where e.started_at >= v_since
  ),
  user_rollup as (
    select
      e.user_id,
      coalesce(
        nullif(btrim(u.email), ''),
        'Anonymous ' || left(e.anonymous_session_id::text, 8)
      ) as display_name,
      sum(e.duration_seconds)::bigint as total_duration_seconds,
      count(*)::bigint as total_event_count,
      count(distinct e.started_at::date)::bigint as total_active_days,
      max(e.ended_at) as last_seen_at
    from scoped e
    left join auth.users u on u.id = e.user_id
    group by e.user_id, e.anonymous_session_id, u.email
  ),
  platform_rollup as (
    select
      coalesce(nullif(btrim(e.app_platform), ''), 'unknown') as platform_label,
      sum(e.duration_seconds)::bigint as total_duration_seconds,
      count(*)::bigint as total_event_count,
      count(distinct coalesce(e.user_id::text, e.anonymous_session_id::text))::bigint as total_active_users,
      count(distinct e.started_at::date)::bigint as total_active_days,
      max(e.ended_at) as last_seen_at
    from scoped e
    group by coalesce(nullif(btrim(e.app_platform), ''), 'unknown')
  )
  select
    'summary'::text,
    'Total tracked time'::text,
    null::uuid,
    null::text,
    coalesce(sum(s.duration_seconds), 0)::bigint,
    count(s.*)::bigint,
    count(distinct coalesce(s.user_id::text, s.anonymous_session_id::text))::bigint,
    count(distinct s.started_at::date)::bigint,
    max(s.ended_at),
    0
  from scoped s
  union all
  select
    'summary'::text,
    'Average screen session'::text,
    null::uuid,
    null::text,
    coalesce(avg(s.duration_seconds), 0)::bigint,
    count(s.*)::bigint,
    count(distinct coalesce(s.user_id::text, s.anonymous_session_id::text))::bigint,
    count(distinct s.started_at::date)::bigint,
    max(s.ended_at),
    1
  from scoped s
  union all
  select
    'screen'::text,
    s.screen_name,
    null::uuid,
    s.screen_name,
    sum(s.duration_seconds)::bigint,
    count(*)::bigint,
    count(distinct coalesce(s.user_id::text, s.anonymous_session_id::text))::bigint,
    count(distinct s.started_at::date)::bigint,
    max(s.ended_at),
    100 + (row_number() over (order by sum(s.duration_seconds) desc, s.screen_name))::integer
  from scoped s
  group by s.screen_name
  union all
  select
    'workspace'::text,
    initcap(p.platform_label),
    null::uuid,
    null::text,
    p.total_duration_seconds,
    p.total_event_count,
    p.total_active_users,
    p.total_active_days,
    p.last_seen_at,
    700 + (row_number() over (order by p.total_duration_seconds desc, p.platform_label))::integer
  from platform_rollup p
  union all
  select
    'user'::text,
    u.display_name,
    u.user_id,
    null::text,
    u.total_duration_seconds,
    u.total_event_count,
    null::bigint,
    u.total_active_days,
    u.last_seen_at,
    1000 + (row_number() over (order by u.total_duration_seconds desc, u.display_name))::integer
  from user_rollup u
  order by 10;
end;
$$;

revoke all on table public.cardmagic_screen_usage_events from public, anon, authenticated;
revoke execute on function public.cardmagic_is_app_developer() from public, anon;
revoke execute on function public.log_cardmagic_screen_usage(uuid, text, text, text, text, timestamptz, timestamptz, jsonb) from public;
revoke execute on function public.get_cardmagic_usage_dashboard(integer) from public, anon;

grant execute on function public.cardmagic_is_app_developer() to authenticated, service_role;
grant execute on function public.log_cardmagic_screen_usage(uuid, text, text, text, text, timestamptz, timestamptz, jsonb) to anon, authenticated, service_role;
grant execute on function public.get_cardmagic_usage_dashboard(integer) to authenticated, service_role;
