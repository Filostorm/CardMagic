create index if not exists community_card_views_user_card_idx
on public.community_card_views (user_id, card_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-card-images',
  'community-card-images',
  true,
  5242880,
  array['image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view community card images" on storage.objects;
create policy "Public can view community card images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'community-card-images');

drop policy if exists "Users can upload own community card images" on storage.objects;
create policy "Users can upload own community card images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-card-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own community card images" on storage.objects;
create policy "Users can update own community card images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'community-card-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'community-card-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.cardmagic_compact_community_card_json(p_card jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  v_card jsonb := coalesce(p_card, '{}'::jsonb);
  v_key text;
begin
  foreach v_key in array array[
    'artUri',
    'artSubjectMaskUri',
    'backArtUri',
    'backArtSubjectMaskUri',
    'setSymbolUri',
    'watermarkUri'
  ]
  loop
    if coalesce(v_card ->> v_key, '') like 'data:%' then
      v_card := v_card - v_key;
    end if;
  end loop;

  return v_card;
end;
$$;

create or replace function public.cardmagic_community_card_feed_json(
  p_name text,
  p_type_line text,
  p_rarity text,
  p_colors text[],
  p_frame_treatment text
)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'name', coalesce(p_name, ''),
    'typeLine', coalesce(p_type_line, ''),
    'rarity', p_rarity,
    'frameColors', coalesce(p_colors, '{}'::text[]),
    'frameTreatment', p_frame_treatment
  ));
$$;

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
      select
        cards.id,
        cards.user_id,
        cards.name,
        cards.type_line,
        cards.rarity,
        cards.colors,
        cards.frame_treatment,
        cards.image_url,
        cards.like_count,
        cards.comment_count,
        cards.created_at,
        cards.updated_at
      from public.cards
      left join public.community_card_views viewer_views
        on viewer_views.card_id = cards.id
        and viewer_views.user_id = v_viewer
      where cards.visibility = 'public'
        and cards.image_url is not null
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
      public.cardmagic_community_card_feed_json(
        page.name,
        page.type_line,
        page.rarity,
        page.colors,
        page.frame_treatment
      ) as card,
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
    select
      cards.id,
      cards.user_id,
      cards.name,
      cards.type_line,
      cards.rarity,
      cards.colors,
      cards.frame_treatment,
      cards.image_url,
      cards.like_count,
      cards.comment_count,
      cards.created_at,
      cards.updated_at
    from public.cards
    left join public.community_card_views viewer_views
      on viewer_views.card_id = cards.id
      and viewer_views.user_id = v_viewer
    where cards.visibility = 'public'
      and cards.image_url is not null
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
    public.cardmagic_community_card_feed_json(
      page.name,
      page.type_line,
      page.rarity,
      page.colors,
      page.frame_treatment
    ) as card,
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
  if not exists (
    select 1
    from public.community_weekly_featured_cards selected
    join public.cards on cards.id = selected.card_id
    where selected.week_start = v_week_start
      and cards.visibility = 'public'
      and cards.image_url is not null
  ) then
    insert into public.community_weekly_featured_cards (week_start, card_id)
    with weekly_winner as (
      select
        cards.id,
        count(weekly_likes.user_id)::bigint as weekly_like_count
      from public.community_card_likes weekly_likes
      join public.cards on cards.id = weekly_likes.card_id
      where weekly_likes.created_at >= v_week_start::timestamptz
        and weekly_likes.created_at < v_week_end::timestamptz
        and cards.visibility = 'public'
        and cards.image_url is not null
      group by cards.id, cards.updated_at
      order by count(weekly_likes.user_id) desc, cards.updated_at desc, cards.id asc
      limit 1
    ),
    fallback as (
      select cards.id
      from public.cards
      where cards.visibility = 'public'
        and cards.image_url is not null
        and not exists (select 1 from weekly_winner)
      order by cards.updated_at desc, cards.id asc
      limit 1
    )
    select v_week_start, ranked.id
    from (
      select weekly_winner.id from weekly_winner
      union all
      select fallback.id from fallback
    ) ranked
    on conflict (week_start) do nothing;
  end if;

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
    public.cardmagic_community_card_feed_json(
      cards.name,
      cards.type_line,
      cards.rarity,
      cards.colors,
      cards.frame_treatment
    ) as card,
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
    and cards.visibility = 'public'
    and cards.image_url is not null;
end;
$$;

revoke execute on function public.cardmagic_compact_community_card_json(jsonb) from public;
revoke execute on function public.cardmagic_community_card_feed_json(text, text, text, text[], text) from public;
revoke execute on function public.community_card_feed(integer, integer, text, boolean) from public;
revoke execute on function public.community_weekly_featured_card() from public;
grant execute on function public.community_card_feed(integer, integer, text, boolean) to anon, authenticated;
grant execute on function public.community_weekly_featured_card() to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
