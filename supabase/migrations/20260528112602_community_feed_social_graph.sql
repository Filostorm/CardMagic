alter table public.profiles
add column if not exists display_name text;

create table if not exists public.community_card_likes (
  card_id text not null references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

create table if not exists public.community_card_comments (
  id uuid primary key default gen_random_uuid(),
  card_id text not null references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_card_comments_body_not_empty check (length(trim(body)) > 0),
  constraint community_card_comments_body_length check (char_length(body) <= 500)
);

create index if not exists community_card_likes_card_created_at_idx
on public.community_card_likes (card_id, created_at desc);

create index if not exists community_card_likes_week_idx
on public.community_card_likes (created_at desc, card_id);

create index if not exists community_card_comments_card_created_at_idx
on public.community_card_comments (card_id, created_at desc);

alter table public.community_card_likes enable row level security;
alter table public.community_card_comments enable row level security;

drop trigger if exists community_card_comments_touch_updated_at on public.community_card_comments;
create trigger community_card_comments_touch_updated_at
before update on public.community_card_comments
for each row
execute function public.touch_updated_at();

drop policy if exists "community_card_likes_select_public_cards" on public.community_card_likes;
create policy "community_card_likes_select_public_cards"
on public.community_card_likes
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cards
    where cards.id = community_card_likes.card_id
      and cards.visibility = 'public'
  )
);

drop policy if exists "community_card_likes_insert_own_public_cards" on public.community_card_likes;
create policy "community_card_likes_insert_own_public_cards"
on public.community_card_likes
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.cards
    where cards.id = community_card_likes.card_id
      and cards.visibility = 'public'
  )
);

drop policy if exists "community_card_likes_delete_own" on public.community_card_likes;
create policy "community_card_likes_delete_own"
on public.community_card_likes
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "community_card_comments_select_public_cards" on public.community_card_comments;
create policy "community_card_comments_select_public_cards"
on public.community_card_comments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cards
    where cards.id = community_card_comments.card_id
      and cards.visibility = 'public'
  )
);

drop policy if exists "community_card_comments_insert_own_public_cards" on public.community_card_comments;
create policy "community_card_comments_insert_own_public_cards"
on public.community_card_comments
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.cards
    where cards.id = community_card_comments.card_id
      and cards.visibility = 'public'
  )
);

drop policy if exists "community_card_comments_update_own" on public.community_card_comments;
create policy "community_card_comments_update_own"
on public.community_card_comments
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "community_card_comments_delete_own" on public.community_card_comments;
create policy "community_card_comments_delete_own"
on public.community_card_comments
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.cardmagic_level_from_progress(p_progress jsonb)
returns integer
language plpgsql
immutable
as $$
declare
  v_level integer := 1;
  v_xp integer := greatest(0, coalesce((p_progress->>'lifetimeXpEarned')::integer, 0));
  v_needed integer := 240;
begin
  while v_xp >= v_needed loop
    v_xp := v_xp - v_needed;
    v_level := v_level + 1;
    v_needed := 240 + greatest(0, v_level - 1) * 65;
  end loop;

  return v_level;
end;
$$;

create or replace function public.cardmagic_public_author_name(p_user_id uuid, p_display_name text)
returns text
language sql
stable
as $$
  select coalesce(nullif(trim(p_display_name), ''), 'Creator ' || upper(left(replace(p_user_id::text, '-', ''), 6)));
$$;

create or replace function public.community_card_feed(p_limit integer default 12, p_offset integer default 0)
returns table (
  id text,
  user_id uuid,
  author_name text,
  author_level integer,
  name text,
  type_line text,
  rarity text,
  colors text[],
  frame_treatment text,
  image_url text,
  card jsonb,
  like_count bigint,
  comment_count bigint,
  liked_by_viewer boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cards.id,
    cards.user_id,
    public.cardmagic_public_author_name(cards.user_id, profiles.display_name) as author_name,
    public.cardmagic_level_from_progress(coalesce(profiles.progress, public.cardmagic_default_progress())) as author_level,
    cards.name,
    cards.type_line,
    cards.rarity,
    cards.colors,
    cards.frame_treatment,
    cards.image_url,
    cards.card,
    coalesce(likes.like_count, 0) as like_count,
    coalesce(comments.comment_count, 0) as comment_count,
    exists (
      select 1
      from public.community_card_likes viewer_likes
      where viewer_likes.card_id = cards.id
        and viewer_likes.user_id = (select auth.uid())
    ) as liked_by_viewer,
    cards.created_at,
    cards.updated_at
  from public.cards
  left join public.profiles on profiles.id = cards.user_id
  left join lateral (
    select count(*)::bigint as like_count
    from public.community_card_likes
    where community_card_likes.card_id = cards.id
  ) likes on true
  left join lateral (
    select count(*)::bigint as comment_count
    from public.community_card_comments
    where community_card_comments.card_id = cards.id
  ) comments on true
  where cards.visibility = 'public'
  order by cards.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 12), 50))
  offset greatest(0, coalesce(p_offset, 0));
$$;

create or replace function public.community_weekly_featured_card()
returns table (
  id text,
  user_id uuid,
  author_name text,
  author_level integer,
  name text,
  type_line text,
  rarity text,
  colors text[],
  frame_treatment text,
  image_url text,
  card jsonb,
  like_count bigint,
  comment_count bigint,
  liked_by_viewer boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select
      (date_trunc('week', now() + interval '1 day') - interval '1 day') as week_start,
      (date_trunc('week', now() + interval '1 day') - interval '1 day' + interval '7 days') as week_end
  ),
  ranked as (
    select
      cards.id,
      count(weekly_likes.user_id)::bigint as weekly_like_count
    from public.cards
    cross join bounds
    left join public.community_card_likes weekly_likes
      on weekly_likes.card_id = cards.id
      and weekly_likes.created_at >= bounds.week_start
      and weekly_likes.created_at < bounds.week_end
    where cards.visibility = 'public'
    group by cards.id, cards.updated_at
    order by count(weekly_likes.user_id) desc, cards.updated_at desc
    limit 1
  )
  select
    cards.id,
    cards.user_id,
    public.cardmagic_public_author_name(cards.user_id, profiles.display_name) as author_name,
    public.cardmagic_level_from_progress(coalesce(profiles.progress, public.cardmagic_default_progress())) as author_level,
    cards.name,
    cards.type_line,
    cards.rarity,
    cards.colors,
    cards.frame_treatment,
    cards.image_url,
    cards.card,
    coalesce(likes.like_count, 0) as like_count,
    coalesce(comments.comment_count, 0) as comment_count,
    exists (
      select 1
      from public.community_card_likes viewer_likes
      where viewer_likes.card_id = cards.id
        and viewer_likes.user_id = (select auth.uid())
    ) as liked_by_viewer,
    cards.created_at,
    cards.updated_at
  from ranked
  join public.cards on cards.id = ranked.id
  left join public.profiles on profiles.id = cards.user_id
  left join lateral (
    select count(*)::bigint as like_count
    from public.community_card_likes
    where community_card_likes.card_id = cards.id
  ) likes on true
  left join lateral (
    select count(*)::bigint as comment_count
    from public.community_card_comments
    where community_card_comments.card_id = cards.id
  ) comments on true;
$$;

create or replace function public.community_set_directory(p_limit integer default 24, p_offset integer default 0)
returns table (
  id uuid,
  user_id uuid,
  author_name text,
  author_level integer,
  name text,
  set_code text,
  card_back_id text,
  set_symbol_preset text,
  set_symbol_uri text,
  set_symbol_uses_rarity_treatment boolean,
  card_count bigint,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    card_sets.id,
    card_sets.user_id,
    public.cardmagic_public_author_name(card_sets.user_id, profiles.display_name) as author_name,
    public.cardmagic_level_from_progress(coalesce(profiles.progress, public.cardmagic_default_progress())) as author_level,
    card_sets.name,
    card_sets.set_code,
    card_sets.card_back_id,
    card_sets.set_symbol_preset,
    card_sets.set_symbol_uri,
    card_sets.set_symbol_uses_rarity_treatment,
    count(cards.id)::bigint as card_count,
    card_sets.created_at,
    card_sets.updated_at
  from public.card_sets
  join public.card_set_cards on card_set_cards.user_id = card_sets.user_id and card_set_cards.set_id = card_sets.id
  join public.cards on cards.id = card_set_cards.card_id and cards.visibility = 'public'
  left join public.profiles on profiles.id = card_sets.user_id
  group by card_sets.id, profiles.display_name, profiles.progress
  having count(cards.id) > 0
  order by card_sets.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 24), 50))
  offset greatest(0, coalesce(p_offset, 0));
$$;

create or replace function public.set_profile_display_name(p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_display_name text := left(nullif(trim(p_display_name), ''), 60);
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, display_name)
  values (v_user_id, v_display_name)
  on conflict (id) do update set
    display_name = excluded.display_name;
end;
$$;

revoke execute on function public.community_card_feed(integer, integer) from public;
revoke execute on function public.community_weekly_featured_card() from public;
revoke execute on function public.community_set_directory(integer, integer) from public;
revoke execute on function public.set_profile_display_name(text) from public;

grant execute on function public.community_card_feed(integer, integer) to anon, authenticated;
grant execute on function public.community_weekly_featured_card() to anon, authenticated;
grant execute on function public.community_set_directory(integer, integer) to anon, authenticated;
grant execute on function public.set_profile_display_name(text) to authenticated;

grant select on public.community_card_likes to anon, authenticated;
grant insert, delete on public.community_card_likes to authenticated;
grant select on public.community_card_comments to anon, authenticated;
grant insert, update, delete on public.community_card_comments to authenticated;

select pg_notify('pgrst', 'reload schema');
