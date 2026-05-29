create table if not exists public.community_user_follows (
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  followed_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, followed_user_id),
  constraint community_user_follows_no_self_follow check (follower_user_id <> followed_user_id)
);

create table if not exists public.community_card_views (
  card_id text not null references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

create index if not exists community_user_follows_followed_idx
on public.community_user_follows (followed_user_id, created_at desc);

create index if not exists community_card_views_user_seen_idx
on public.community_card_views (user_id, seen_at desc);

create index if not exists cards_public_updated_like_idx
on public.cards (visibility, updated_at desc);

alter table public.community_user_follows enable row level security;
alter table public.community_card_views enable row level security;

drop policy if exists "community_user_follows_select_own" on public.community_user_follows;
create policy "community_user_follows_select_own"
on public.community_user_follows
for select
to authenticated
using ((select auth.uid()) = follower_user_id);

drop policy if exists "community_user_follows_insert_own" on public.community_user_follows;
create policy "community_user_follows_insert_own"
on public.community_user_follows
for insert
to authenticated
with check ((select auth.uid()) = follower_user_id);

drop policy if exists "community_user_follows_delete_own" on public.community_user_follows;
create policy "community_user_follows_delete_own"
on public.community_user_follows
for delete
to authenticated
using ((select auth.uid()) = follower_user_id);

drop policy if exists "community_card_views_select_own" on public.community_card_views;
create policy "community_card_views_select_own"
on public.community_card_views
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "community_card_views_insert_own_public_cards" on public.community_card_views;
create policy "community_card_views_insert_own_public_cards"
on public.community_card_views
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.cards
    where cards.id = community_card_views.card_id
      and cards.visibility = 'public'
  )
);

drop policy if exists "community_card_views_update_own_public_cards" on public.community_card_views;
create policy "community_card_views_update_own_public_cards"
on public.community_card_views
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.cards
    where cards.id = community_card_views.card_id
      and cards.visibility = 'public'
  )
);

drop function if exists public.community_card_feed(integer, integer);
drop function if exists public.community_card_feed(integer, integer, text, boolean);

create or replace function public.community_card_feed(
  p_limit integer,
  p_offset integer,
  p_sort text,
  p_hide_seen boolean
)
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
  followed_by_viewer boolean,
  seen_by_viewer boolean,
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
    viewer_likes.user_id is not null as liked_by_viewer,
    viewer_follows.followed_user_id is not null as followed_by_viewer,
    viewer_views.card_id is not null as seen_by_viewer,
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
  left join public.community_card_likes viewer_likes
    on viewer_likes.card_id = cards.id
    and viewer_likes.user_id = (select auth.uid())
  left join public.community_user_follows viewer_follows
    on viewer_follows.followed_user_id = cards.user_id
    and viewer_follows.follower_user_id = (select auth.uid())
  left join public.community_card_views viewer_views
    on viewer_views.card_id = cards.id
    and viewer_views.user_id = (select auth.uid())
  where cards.visibility = 'public'
    and (
      not coalesce(p_hide_seen, false)
      or (select auth.uid()) is null
      or viewer_views.card_id is null
    )
  order by
    case when coalesce(p_sort, 'newest') = 'most_liked' then coalesce(likes.like_count, 0) end desc nulls last,
    cards.updated_at desc,
    cards.id asc
  limit greatest(1, least(coalesce(p_limit, 12), 50))
  offset greatest(0, coalesce(p_offset, 0));
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
    feed.id,
    feed.user_id,
    feed.author_name,
    feed.author_level,
    feed.name,
    feed.type_line,
    feed.rarity,
    feed.colors,
    feed.frame_treatment,
    feed.image_url,
    feed.card,
    feed.like_count,
    feed.comment_count,
    feed.liked_by_viewer,
    feed.created_at,
    feed.updated_at
  from public.community_card_feed(p_limit, p_offset, 'newest', false) as feed;
$$;

drop function if exists public.community_weekly_featured_card();

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
  followed_by_viewer boolean,
  seen_by_viewer boolean,
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
    viewer_likes.user_id is not null as liked_by_viewer,
    viewer_follows.followed_user_id is not null as followed_by_viewer,
    viewer_views.card_id is not null as seen_by_viewer,
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
  ) comments on true
  left join public.community_card_likes viewer_likes
    on viewer_likes.card_id = cards.id
    and viewer_likes.user_id = (select auth.uid())
  left join public.community_user_follows viewer_follows
    on viewer_follows.followed_user_id = cards.user_id
    and viewer_follows.follower_user_id = (select auth.uid())
  left join public.community_card_views viewer_views
    on viewer_views.card_id = cards.id
    and viewer_views.user_id = (select auth.uid());
$$;

create or replace function public.mark_community_cards_seen(p_card_ids text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    return;
  end if;

  insert into public.community_card_views (card_id, user_id, seen_at)
  select distinct cards.id, v_user_id, now()
  from unnest(coalesce(p_card_ids, '{}'::text[])) as requested(card_id)
  join public.cards on cards.id = requested.card_id
  where cards.visibility = 'public'
  on conflict (card_id, user_id) do update set
    seen_at = excluded.seen_at;
end;
$$;

revoke execute on function public.community_card_feed(integer, integer, text, boolean) from public;
revoke execute on function public.community_card_feed(integer, integer) from public;
revoke execute on function public.community_weekly_featured_card() from public;
revoke execute on function public.mark_community_cards_seen(text[]) from public;

grant execute on function public.community_card_feed(integer, integer, text, boolean) to anon, authenticated;
grant execute on function public.community_card_feed(integer, integer) to anon, authenticated;
grant execute on function public.community_weekly_featured_card() to anon, authenticated;
grant execute on function public.mark_community_cards_seen(text[]) to authenticated;

grant select, insert, delete on public.community_user_follows to authenticated;
grant select, insert, update on public.community_card_views to authenticated;

select pg_notify('pgrst', 'reload schema');
