create table if not exists public.community_polls (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  selection_type text not null default 'single',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint community_polls_title_not_empty check (length(trim(title)) > 0),
  constraint community_polls_title_length check (char_length(title) <= 120),
  constraint community_polls_description_length check (description is null or char_length(description) <= 500),
  constraint community_polls_selection_type_check check (selection_type in ('single', 'multiple')),
  constraint community_polls_status_check check (status in ('open', 'closed'))
);

create table if not exists public.community_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.community_polls(id) on delete cascade,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint community_poll_options_label_not_empty check (length(trim(label)) > 0),
  constraint community_poll_options_label_length check (char_length(label) <= 120)
);

create table if not exists public.community_poll_votes (
  poll_id uuid not null references public.community_polls(id) on delete cascade,
  option_id uuid not null references public.community_poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (option_id, user_id)
);

create index if not exists community_polls_status_created_idx
on public.community_polls (status, created_at desc);

create index if not exists community_poll_options_poll_position_idx
on public.community_poll_options (poll_id, position asc);

create index if not exists community_poll_votes_poll_user_idx
on public.community_poll_votes (poll_id, user_id);

alter table public.community_polls enable row level security;
alter table public.community_poll_options enable row level security;
alter table public.community_poll_votes enable row level security;

drop trigger if exists community_polls_touch_updated_at on public.community_polls;
create trigger community_polls_touch_updated_at
before update on public.community_polls
for each row
execute function public.touch_updated_at();

create or replace function public.cardmagic_can_manage_community_polls()
returns boolean
language sql
stable
set search_path = public
as $$
  select lower(coalesce((auth.jwt() ->> 'email'), '')) = 'gtjoe51@gmail.com';
$$;

drop policy if exists "community_polls_select_all" on public.community_polls;
create policy "community_polls_select_all"
on public.community_polls
for select
to anon, authenticated
using (true);

drop policy if exists "community_polls_insert_admin" on public.community_polls;
create policy "community_polls_insert_admin"
on public.community_polls
for insert
to authenticated
with check (public.cardmagic_can_manage_community_polls() and (select auth.uid()) = created_by);

drop policy if exists "community_polls_update_admin" on public.community_polls;
create policy "community_polls_update_admin"
on public.community_polls
for update
to authenticated
using (public.cardmagic_can_manage_community_polls())
with check (public.cardmagic_can_manage_community_polls());

drop policy if exists "community_poll_options_select_all" on public.community_poll_options;
create policy "community_poll_options_select_all"
on public.community_poll_options
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.community_polls
    where community_polls.id = community_poll_options.poll_id
  )
);

drop policy if exists "community_poll_options_insert_admin" on public.community_poll_options;
create policy "community_poll_options_insert_admin"
on public.community_poll_options
for insert
to authenticated
with check (public.cardmagic_can_manage_community_polls());

drop policy if exists "community_poll_options_update_admin" on public.community_poll_options;
create policy "community_poll_options_update_admin"
on public.community_poll_options
for update
to authenticated
using (public.cardmagic_can_manage_community_polls())
with check (public.cardmagic_can_manage_community_polls());

drop policy if exists "community_poll_options_delete_admin" on public.community_poll_options;
create policy "community_poll_options_delete_admin"
on public.community_poll_options
for delete
to authenticated
using (public.cardmagic_can_manage_community_polls());

drop policy if exists "community_poll_votes_select_own" on public.community_poll_votes;
create policy "community_poll_votes_select_own"
on public.community_poll_votes
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "community_poll_votes_insert_own_open" on public.community_poll_votes;
create policy "community_poll_votes_insert_own_open"
on public.community_poll_votes
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.community_polls
    where community_polls.id = community_poll_votes.poll_id
      and community_polls.status = 'open'
  )
  and exists (
    select 1
    from public.community_poll_options
    where community_poll_options.id = community_poll_votes.option_id
      and community_poll_options.poll_id = community_poll_votes.poll_id
  )
);

drop policy if exists "community_poll_votes_delete_own_open" on public.community_poll_votes;
create policy "community_poll_votes_delete_own_open"
on public.community_poll_votes
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.community_polls
    where community_polls.id = community_poll_votes.poll_id
      and community_polls.status = 'open'
  )
);

create or replace function public.community_poll_list()
returns table (
  poll_id uuid,
  title text,
  description text,
  selection_type text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  closed_at timestamptz,
  option_id uuid,
  option_label text,
  option_position integer,
  vote_count bigint,
  selected_by_viewer boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    polls.id as poll_id,
    polls.title,
    polls.description,
    polls.selection_type,
    polls.status,
    polls.created_at,
    polls.updated_at,
    polls.closed_at,
    options.id as option_id,
    options.label as option_label,
    options.position as option_position,
    coalesce(vote_counts.vote_count, 0) as vote_count,
    exists (
      select 1
      from public.community_poll_votes viewer_votes
      where viewer_votes.poll_id = polls.id
        and viewer_votes.option_id = options.id
        and viewer_votes.user_id = (select auth.uid())
    ) as selected_by_viewer
  from public.community_polls polls
  join public.community_poll_options options on options.poll_id = polls.id
  left join lateral (
    select count(*)::bigint as vote_count
    from public.community_poll_votes votes
    where votes.option_id = options.id
  ) vote_counts on true
  order by
    case when polls.status = 'open' then 0 else 1 end,
    polls.created_at desc,
    options.position asc;
$$;

create or replace function public.create_community_poll(
  p_title text,
  p_description text,
  p_selection_type text,
  p_options text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_poll_id uuid;
  v_title text := left(trim(coalesce(p_title, '')), 120);
  v_description text := nullif(left(trim(coalesce(p_description, '')), 500), '');
  v_selection_type text := case when p_selection_type = 'multiple' then 'multiple' else 'single' end;
  v_options text[] := array(
    select option_label
    from (
      select distinct on (lower(left(trim(option_label), 120)))
        left(trim(option_label), 120) as option_label,
        option_ordinality
      from unnest(coalesce(p_options, array[]::text[])) with ordinality as option_input(option_label, option_ordinality)
      where length(trim(option_label)) > 0
      order by lower(left(trim(option_label), 120)), option_ordinality
    ) deduped_options
    order by option_ordinality
  );
  v_option text;
  v_position integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.cardmagic_can_manage_community_polls() then
    raise exception 'Only CardMagic admins can create polls.';
  end if;

  if length(v_title) = 0 then
    raise exception 'Poll title is required.';
  end if;

  if coalesce(array_length(v_options, 1), 0) < 2 then
    raise exception 'Polls need at least two options.';
  end if;

  insert into public.community_polls (created_by, title, description, selection_type)
  values (v_user_id, v_title, v_description, v_selection_type)
  returning id into v_poll_id;

  foreach v_option in array v_options loop
    insert into public.community_poll_options (poll_id, label, position)
    values (v_poll_id, v_option, v_position);
    v_position := v_position + 1;
  end loop;

  return v_poll_id;
end;
$$;

create or replace function public.set_community_poll_status(p_poll_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text := case when p_status = 'open' then 'open' else 'closed' end;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;

  if not public.cardmagic_can_manage_community_polls() then
    raise exception 'Only CardMagic admins can update polls.';
  end if;

  update public.community_polls
  set
    status = v_status,
    closed_at = case when v_status = 'closed' then coalesce(closed_at, now()) else null end
  where id = p_poll_id;
end;
$$;

create or replace function public.submit_community_poll_vote(p_poll_id uuid, p_option_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_selection_type text;
  v_option_ids uuid[] := array(
    select distinct option_id
    from unnest(coalesce(p_option_ids, array[]::uuid[])) as option_id
  );
  v_valid_count integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to vote on community polls.';
  end if;

  select selection_type into v_selection_type
  from public.community_polls
  where id = p_poll_id
    and status = 'open';

  if v_selection_type is null then
    raise exception 'This poll is closed or unavailable.';
  end if;

  if coalesce(array_length(v_option_ids, 1), 0) = 0 then
    raise exception 'Choose at least one option.';
  end if;

  if v_selection_type = 'single' and array_length(v_option_ids, 1) <> 1 then
    raise exception 'Choose one option for this poll.';
  end if;

  select count(*)::integer into v_valid_count
  from public.community_poll_options
  where poll_id = p_poll_id
    and id = any(v_option_ids);

  if v_valid_count <> array_length(v_option_ids, 1) then
    raise exception 'One or more poll options are invalid.';
  end if;

  delete from public.community_poll_votes
  where poll_id = p_poll_id
    and user_id = v_user_id;

  insert into public.community_poll_votes (poll_id, option_id, user_id)
  select p_poll_id, option_id, v_user_id
  from unnest(v_option_ids) as option_id;
end;
$$;

revoke execute on function public.cardmagic_can_manage_community_polls() from public;
revoke execute on function public.community_poll_list() from public;
revoke execute on function public.create_community_poll(text, text, text, text[]) from public;
revoke execute on function public.set_community_poll_status(uuid, text) from public;
revoke execute on function public.submit_community_poll_vote(uuid, uuid[]) from public;
revoke execute on function public.create_community_poll(text, text, text, text[]) from anon;
revoke execute on function public.set_community_poll_status(uuid, text) from anon;
revoke execute on function public.submit_community_poll_vote(uuid, uuid[]) from anon;

grant execute on function public.community_poll_list() to anon, authenticated;
grant execute on function public.cardmagic_can_manage_community_polls() to authenticated;
grant execute on function public.create_community_poll(text, text, text, text[]) to authenticated;
grant execute on function public.set_community_poll_status(uuid, text) to authenticated;
grant execute on function public.submit_community_poll_vote(uuid, uuid[]) to authenticated;

grant select on public.community_polls to anon, authenticated;
grant select on public.community_poll_options to anon, authenticated;
grant insert, update on public.community_polls to authenticated;
grant insert, update, delete on public.community_poll_options to authenticated;
grant select, insert, delete on public.community_poll_votes to authenticated;

select pg_notify('pgrst', 'reload schema');
