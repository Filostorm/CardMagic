create index if not exists cards_public_updated_id_idx
on public.cards (updated_at desc, id asc)
where visibility = 'public';

create index if not exists community_card_comments_card_idx
on public.community_card_comments (card_id);

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
    with like_counts as (
      select community_card_likes.card_id, count(*)::bigint as like_count
      from public.community_card_likes
      group by community_card_likes.card_id
    ),
    comment_counts as (
      select community_card_comments.card_id, count(*)::bigint as comment_count
      from public.community_card_comments
      group by community_card_comments.card_id
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
      coalesce(like_counts.like_count, 0) as like_count,
      coalesce(comment_counts.comment_count, 0) as comment_count,
      viewer_likes.user_id is not null as liked_by_viewer,
      viewer_follows.followed_user_id is not null as followed_by_viewer,
      viewer_views.card_id is not null as seen_by_viewer,
      cards.created_at,
      cards.updated_at
    from public.cards
    left join public.profiles on profiles.id = cards.user_id
    left join like_counts on like_counts.card_id = cards.id
    left join comment_counts on comment_counts.card_id = cards.id
    left join public.community_card_likes viewer_likes
      on viewer_likes.card_id = cards.id
      and viewer_likes.user_id = v_viewer
    left join public.community_user_follows viewer_follows
      on viewer_follows.followed_user_id = cards.user_id
      and viewer_follows.follower_user_id = v_viewer
    left join public.community_card_views viewer_views
      on viewer_views.card_id = cards.id
      and viewer_views.user_id = v_viewer
    where cards.visibility = 'public'
      and (
        not coalesce(p_hide_seen, false)
        or v_viewer is null
        or viewer_views.card_id is null
      )
    order by coalesce(like_counts.like_count, 0) desc, cards.updated_at desc, cards.id asc
    limit v_limit
    offset v_offset;

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
    coalesce(likes.like_count, 0) as like_count,
    coalesce(comments.comment_count, 0) as comment_count,
    viewer_likes.user_id is not null as liked_by_viewer,
    viewer_follows.followed_user_id is not null as followed_by_viewer,
    viewer_views.card_id is not null as seen_by_viewer,
    page.created_at,
    page.updated_at
  from page
  left join public.profiles on profiles.id = page.user_id
  left join lateral (
    select count(*)::bigint as like_count
    from public.community_card_likes
    where community_card_likes.card_id = page.id
  ) likes on true
  left join lateral (
    select count(*)::bigint as comment_count
    from public.community_card_comments
    where community_card_comments.card_id = page.id
  ) comments on true
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

revoke execute on function public.community_card_feed(integer, integer, text, boolean) from public;
grant execute on function public.community_card_feed(integer, integer, text, boolean) to anon, authenticated;
