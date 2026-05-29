alter table public.cards
add column if not exists like_count integer not null default 0,
add column if not exists comment_count integer not null default 0;

with like_counts as (
  select cards.id, count(community_card_likes.user_id)::integer as like_count
  from public.cards
  left join public.community_card_likes on community_card_likes.card_id = cards.id
  group by cards.id
)
update public.cards
set like_count = like_counts.like_count
from like_counts
where cards.id = like_counts.id
  and cards.like_count is distinct from like_counts.like_count;

with comment_counts as (
  select cards.id, count(community_card_comments.id)::integer as comment_count
  from public.cards
  left join public.community_card_comments on community_card_comments.card_id = cards.id
  group by cards.id
)
update public.cards
set comment_count = comment_counts.comment_count
from comment_counts
where cards.id = comment_counts.id
  and cards.comment_count is distinct from comment_counts.comment_count;

create index if not exists cards_public_like_updated_id_idx
on public.cards (like_count desc, updated_at desc, id asc)
where visibility = 'public';

create or replace function public.cardmagic_sync_card_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.cards
    set like_count = like_count + 1
    where id = new.card_id;

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.cards
    set like_count = greatest(like_count - 1, 0)
    where id = old.card_id;

    return old;
  end if;

  return null;
end;
$$;

create or replace function public.cardmagic_sync_card_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.cards
    set comment_count = comment_count + 1
    where id = new.card_id;

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.cards
    set comment_count = greatest(comment_count - 1, 0)
    where id = old.card_id;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists cardmagic_card_like_count_insert on public.community_card_likes;
create trigger cardmagic_card_like_count_insert
after insert on public.community_card_likes
for each row
execute function public.cardmagic_sync_card_like_count();

drop trigger if exists cardmagic_card_like_count_delete on public.community_card_likes;
create trigger cardmagic_card_like_count_delete
after delete on public.community_card_likes
for each row
execute function public.cardmagic_sync_card_like_count();

drop trigger if exists cardmagic_card_comment_count_insert on public.community_card_comments;
create trigger cardmagic_card_comment_count_insert
after insert on public.community_card_comments
for each row
execute function public.cardmagic_sync_card_comment_count();

drop trigger if exists cardmagic_card_comment_count_delete on public.community_card_comments;
create trigger cardmagic_card_comment_count_delete
after delete on public.community_card_comments
for each row
execute function public.cardmagic_sync_card_comment_count();

revoke execute on function public.cardmagic_sync_card_like_count() from public;
revoke execute on function public.cardmagic_sync_card_comment_count() from public;

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
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 12), 50));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
  v_viewer uuid := (select auth.uid());
begin
  if coalesce(p_sort, 'newest') = 'most_liked' then
    return query
    with page as (
      select cards.*
      from public.cards
      left join public.community_card_views viewer_views
        on viewer_views.card_id = cards.id
        and viewer_views.user_id = v_viewer
      where cards.visibility = 'public'
        and (
          not coalesce(p_hide_seen, false)
          or v_viewer is null
          or viewer_views.card_id is null
        )
      order by cards.like_count desc, cards.updated_at desc, cards.id asc
      limit v_limit
      offset v_offset
    )
    select
      page.id,
      page.user_id,
      public.cardmagic_public_author_name(page.user_id, profiles.display_name) as author_name,
      public.cardmagic_level_from_progress(coalesce(profiles.progress, public.cardmagic_default_progress())) as author_level,
      page.name,
      page.type_line,
      page.rarity,
      page.colors,
      page.frame_treatment,
      page.image_url,
      page.card,
      page.like_count::bigint,
      page.comment_count::bigint,
      viewer_likes.user_id is not null as liked_by_viewer,
      viewer_follows.followed_user_id is not null as followed_by_viewer,
      viewer_views.card_id is not null as seen_by_viewer,
      page.created_at,
      page.updated_at
    from page
    left join public.profiles on profiles.id = page.user_id
    left join public.community_card_likes viewer_likes
      on viewer_likes.card_id = page.id
      and viewer_likes.user_id = v_viewer
    left join public.community_user_follows viewer_follows
      on viewer_follows.followed_user_id = page.user_id
      and viewer_follows.follower_user_id = v_viewer
    left join public.community_card_views viewer_views
      on viewer_views.card_id = page.id
      and viewer_views.user_id = v_viewer
    order by page.like_count desc, page.updated_at desc, page.id asc;

    return;
  end if;

  return query
  with page as (
    select cards.*
    from public.cards
    left join public.community_card_views viewer_views
      on viewer_views.card_id = cards.id
      and viewer_views.user_id = v_viewer
    where cards.visibility = 'public'
      and (
        not coalesce(p_hide_seen, false)
        or v_viewer is null
        or viewer_views.card_id is null
      )
    order by cards.updated_at desc, cards.id asc
    limit v_limit
    offset v_offset
  )
  select
    page.id,
    page.user_id,
    public.cardmagic_public_author_name(page.user_id, profiles.display_name) as author_name,
    public.cardmagic_level_from_progress(coalesce(profiles.progress, public.cardmagic_default_progress())) as author_level,
    page.name,
    page.type_line,
    page.rarity,
    page.colors,
    page.frame_treatment,
    page.image_url,
    page.card,
    page.like_count::bigint,
    page.comment_count::bigint,
    viewer_likes.user_id is not null as liked_by_viewer,
    viewer_follows.followed_user_id is not null as followed_by_viewer,
    viewer_views.card_id is not null as seen_by_viewer,
    page.created_at,
    page.updated_at
  from page
  left join public.profiles on profiles.id = page.user_id
  left join public.community_card_likes viewer_likes
    on viewer_likes.card_id = page.id
    and viewer_likes.user_id = v_viewer
  left join public.community_user_follows viewer_follows
    on viewer_follows.followed_user_id = page.user_id
    and viewer_follows.follower_user_id = v_viewer
  left join public.community_card_views viewer_views
    on viewer_views.card_id = page.id
    and viewer_views.user_id = v_viewer
  order by page.updated_at desc, page.id asc;
end;
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
  followed_by_viewer boolean,
  seen_by_viewer boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date := (date_trunc('week', now() + interval '1 day') - interval '1 day')::date;
  v_week_end date := ((date_trunc('week', now() + interval '1 day') - interval '1 day') + interval '7 days')::date;
  v_viewer uuid := (select auth.uid());
begin
  insert into public.community_weekly_featured_cards (week_start, card_id)
  select v_week_start, ranked.id
  from (
    select
      cards.id,
      count(weekly_likes.user_id)::bigint as weekly_like_count
    from public.cards
    left join public.community_card_likes weekly_likes
      on weekly_likes.card_id = cards.id
      and weekly_likes.created_at >= v_week_start::timestamptz
      and weekly_likes.created_at < v_week_end::timestamptz
    where cards.visibility = 'public'
    group by cards.id, cards.updated_at
    order by count(weekly_likes.user_id) desc, cards.updated_at desc
    limit 1
  ) ranked
  on conflict (week_start) do nothing;

  return query
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
    cards.like_count::bigint,
    cards.comment_count::bigint,
    viewer_likes.user_id is not null as liked_by_viewer,
    viewer_follows.followed_user_id is not null as followed_by_viewer,
    viewer_views.card_id is not null as seen_by_viewer,
    cards.created_at,
    cards.updated_at
  from public.community_weekly_featured_cards selected
  join public.cards on cards.id = selected.card_id
  left join public.profiles on profiles.id = cards.user_id
  left join public.community_card_likes viewer_likes
    on viewer_likes.card_id = cards.id
    and viewer_likes.user_id = v_viewer
  left join public.community_user_follows viewer_follows
    on viewer_follows.followed_user_id = cards.user_id
    and viewer_follows.follower_user_id = v_viewer
  left join public.community_card_views viewer_views
    on viewer_views.card_id = cards.id
    and viewer_views.user_id = v_viewer
  where selected.week_start = v_week_start
    and cards.visibility = 'public';
end;
$$;

revoke execute on function public.community_card_feed(integer, integer, text, boolean) from public;
revoke execute on function public.community_weekly_featured_card() from public;

grant execute on function public.community_card_feed(integer, integer, text, boolean) to anon, authenticated;
grant execute on function public.community_weekly_featured_card() to anon, authenticated;

drop policy if exists "Users can view their own feedback" on public.community_feedback;
create policy "Users can view their own feedback"
  on public.community_feedback
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or lower(coalesce((select auth.jwt())->>'email', '')) = 'gtjoe51@gmail.com'
  );

select pg_notify('pgrst', 'reload schema');
