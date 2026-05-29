create table if not exists public.community_weekly_featured_cards (
  week_start date primary key,
  card_id text not null references public.cards(id) on delete cascade,
  selected_at timestamptz not null default now()
);

alter table public.community_weekly_featured_cards enable row level security;

drop policy if exists "community_weekly_featured_cards_select_public_cards" on public.community_weekly_featured_cards;
create policy "community_weekly_featured_cards_select_public_cards"
on public.community_weekly_featured_cards
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cards
    where cards.id = community_weekly_featured_cards.card_id
      and cards.visibility = 'public'
  )
);

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
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date := (date_trunc('week', now() + interval '1 day') - interval '1 day')::date;
  v_week_end date := ((date_trunc('week', now() + interval '1 day') - interval '1 day') + interval '7 days')::date;
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
    coalesce(likes.like_count, 0) as like_count,
    coalesce(comments.comment_count, 0) as comment_count,
    viewer_likes.user_id is not null as liked_by_viewer,
    viewer_follows.followed_user_id is not null as followed_by_viewer,
    viewer_views.card_id is not null as seen_by_viewer,
    cards.created_at,
    cards.updated_at
  from public.community_weekly_featured_cards selected
  join public.cards on cards.id = selected.card_id
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
  where selected.week_start = v_week_start
    and cards.visibility = 'public';
end;
$$;

revoke execute on function public.community_weekly_featured_card() from public;
grant execute on function public.community_weekly_featured_card() to anon, authenticated;

grant select on public.community_weekly_featured_cards to anon, authenticated;
