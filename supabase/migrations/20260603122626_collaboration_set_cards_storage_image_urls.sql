create or replace function public.collaboration_set_cards(p_set_id uuid)
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
    coalesce(
      cards.image_url,
      case
        when stored_set_image.name is not null then
          'https://lfalybddbubnkrbhaafj.supabase.co/storage/v1/object/public/community-card-images/' ||
          stored_set_image.name
        else null
      end
    ) as image_url,
    cards.card,
    cards.like_count::bigint,
    cards.comment_count::bigint,
    (viewer_likes.user_id is not null) as liked_by_viewer,
    (viewer_follows.follower_user_id is not null) as followed_by_viewer,
    (viewer_views.user_id is not null) as seen_by_viewer,
    cards.created_at,
    cards.updated_at
  from public.card_sets
  join public.card_set_cards
    on card_set_cards.user_id = card_sets.user_id
    and card_set_cards.set_id = card_sets.id
  join public.cards on cards.id = card_set_cards.card_id
  left join lateral (
    select objects.name
    from storage.objects
    where objects.bucket_id = 'community-card-images'
      and objects.name =
        'sets/' ||
        card_sets.id::text ||
        '/cards/' ||
        public.cardmagic_safe_storage_card_id(cards.id) ||
        '.png'
    limit 1
  ) stored_set_image on true
  left join public.profiles on profiles.id = cards.user_id
  left join public.community_card_likes viewer_likes
    on viewer_likes.card_id = cards.id
    and viewer_likes.user_id = (select auth.uid())
  left join public.community_user_follows viewer_follows
    on viewer_follows.followed_user_id = cards.user_id
    and viewer_follows.follower_user_id = (select auth.uid())
  left join public.community_card_views viewer_views
    on viewer_views.card_id = cards.id
    and viewer_views.user_id = (select auth.uid())
  where card_sets.id = p_set_id
    and public.cardmagic_is_set_collaborator(p_set_id)
  order by card_set_cards.position asc, cards.created_at asc;
$$;

revoke execute on function public.collaboration_set_cards(uuid) from public;
revoke execute on function public.collaboration_set_cards(uuid) from anon;
grant execute on function public.collaboration_set_cards(uuid) to authenticated;
