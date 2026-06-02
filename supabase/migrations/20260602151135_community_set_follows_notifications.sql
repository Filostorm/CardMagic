begin;

create table if not exists public.community_set_follows (
  set_id uuid not null references public.card_sets(id) on delete cascade,
  viewer_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (set_id, viewer_user_id)
);

create index if not exists community_set_follows_viewer_created_idx
on public.community_set_follows (viewer_user_id, created_at desc);

create index if not exists community_set_follows_set_created_idx
on public.community_set_follows (set_id, created_at desc);

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  set_id uuid references public.card_sets(id) on delete cascade,
  card_id text references public.cards(id) on delete set null,
  kind text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint community_notifications_kind_check check (
    kind in ('followed_set_card_added', 'set_followed')
  ),
  constraint community_notifications_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists community_notifications_recipient_created_idx
on public.community_notifications (recipient_user_id, created_at desc);

create index if not exists community_notifications_recipient_unread_idx
on public.community_notifications (recipient_user_id, created_at desc)
where read_at is null;

alter table public.community_set_follows enable row level security;
alter table public.community_notifications enable row level security;

create or replace function public.cardmagic_can_follow_community_set(p_set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.card_sets
    join public.card_set_cards
      on card_set_cards.user_id = card_sets.user_id
      and card_set_cards.set_id = card_sets.id
    join public.cards
      on cards.id = card_set_cards.card_id
      and cards.visibility = 'public'
    where card_sets.id = p_set_id
      and card_sets.user_id <> (select auth.uid())
  );
$$;

drop policy if exists "community_set_follows_select_own" on public.community_set_follows;
create policy "community_set_follows_select_own"
on public.community_set_follows
for select
to authenticated
using ((select auth.uid()) = viewer_user_id);

drop policy if exists "community_set_follows_insert_own_public_sets" on public.community_set_follows;
create policy "community_set_follows_insert_own_public_sets"
on public.community_set_follows
for insert
to authenticated
with check (
  (select auth.uid()) = viewer_user_id
  and public.cardmagic_can_follow_community_set(set_id)
);

drop policy if exists "community_set_follows_delete_own" on public.community_set_follows;
create policy "community_set_follows_delete_own"
on public.community_set_follows
for delete
to authenticated
using ((select auth.uid()) = viewer_user_id);

drop policy if exists "community_notifications_select_own" on public.community_notifications;
create policy "community_notifications_select_own"
on public.community_notifications
for select
to authenticated
using ((select auth.uid()) = recipient_user_id);

drop policy if exists "community_notifications_update_own" on public.community_notifications;
create policy "community_notifications_update_own"
on public.community_notifications
for update
to authenticated
using ((select auth.uid()) = recipient_user_id)
with check ((select auth.uid()) = recipient_user_id);

create or replace function public.cardmagic_notify_community_set_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_user_id uuid;
  v_set_name text;
  v_actor_name text;
begin
  select card_sets.user_id, card_sets.name
  into v_owner_user_id, v_set_name
  from public.card_sets
  where card_sets.id = new.set_id;

  if v_owner_user_id is null or v_owner_user_id = new.viewer_user_id then
    return new;
  end if;

  select public.cardmagic_public_author_name(new.viewer_user_id, profiles.display_name)
  into v_actor_name
  from public.profiles
  where profiles.id = new.viewer_user_id;

  insert into public.community_notifications (
    recipient_user_id,
    actor_user_id,
    set_id,
    kind,
    metadata
  )
  values (
    v_owner_user_id,
    new.viewer_user_id,
    new.set_id,
    'set_followed',
    jsonb_build_object(
      'setName', coalesce(v_set_name, 'Untitled Set'),
      'actorName', coalesce(v_actor_name, public.cardmagic_public_author_name(new.viewer_user_id, null))
    )
  );

  return new;
end;
$$;

create or replace function public.cardmagic_notify_followed_set_card_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_card_user_id uuid;
  v_card_name text;
  v_card_visibility text;
  v_set_name text;
  v_notification_actor_user_id uuid;
  v_notification_actor_name text;
begin
  select cards.user_id, cards.name, cards.visibility
  into v_card_user_id, v_card_name, v_card_visibility
  from public.cards
  where cards.id = new.card_id;

  if coalesce(v_card_visibility, '') <> 'public' then
    return new;
  end if;

  select card_sets.name
  into v_set_name
  from public.card_sets
  where card_sets.id = new.set_id;

  v_notification_actor_user_id := coalesce(v_actor_user_id, v_card_user_id, new.user_id);

  select public.cardmagic_public_author_name(v_notification_actor_user_id, profiles.display_name)
  into v_notification_actor_name
  from public.profiles
  where profiles.id = v_notification_actor_user_id;

  insert into public.community_notifications (
    recipient_user_id,
    actor_user_id,
    set_id,
    card_id,
    kind,
    metadata
  )
  select
    community_set_follows.viewer_user_id,
    v_notification_actor_user_id,
    new.set_id,
    new.card_id,
    'followed_set_card_added',
    jsonb_build_object(
      'setName', coalesce(v_set_name, 'Untitled Set'),
      'cardName', coalesce(nullif(v_card_name, ''), 'Untitled Card'),
      'actorName', coalesce(v_notification_actor_name, public.cardmagic_public_author_name(v_notification_actor_user_id, null))
    )
  from public.community_set_follows
  where community_set_follows.set_id = new.set_id
    and community_set_follows.viewer_user_id <> v_notification_actor_user_id;

  return new;
end;
$$;

drop trigger if exists community_set_follows_notify_owner on public.community_set_follows;
create trigger community_set_follows_notify_owner
after insert on public.community_set_follows
for each row
execute function public.cardmagic_notify_community_set_follow();

drop trigger if exists card_set_cards_notify_followers on public.card_set_cards;
create trigger card_set_cards_notify_followers
after insert on public.card_set_cards
for each row
execute function public.cardmagic_notify_followed_set_card_added();

drop function if exists public.community_set_directory(integer, integer);
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
  follower_count bigint,
  followed_by_viewer boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with public_sets as (
    select
      card_sets.id,
      card_sets.user_id,
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
    join public.card_set_cards
      on card_set_cards.user_id = card_sets.user_id
      and card_set_cards.set_id = card_sets.id
    join public.cards
      on cards.id = card_set_cards.card_id
      and cards.visibility = 'public'
    group by card_sets.id
    having count(cards.id) > 0
    order by card_sets.updated_at desc
    limit greatest(1, least(coalesce(p_limit, 24), 50))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select
    public_sets.id,
    public_sets.user_id,
    public.cardmagic_public_author_name(public_sets.user_id, profiles.display_name) as author_name,
    public.cardmagic_level_from_progress(coalesce(profiles.progress, public.cardmagic_default_progress())) as author_level,
    public_sets.name,
    public_sets.set_code,
    public_sets.card_back_id,
    public_sets.set_symbol_preset,
    public_sets.set_symbol_uri,
    public_sets.set_symbol_uses_rarity_treatment,
    public_sets.card_count,
    coalesce(follow_counts.follower_count, 0) as follower_count,
    viewer_follow.viewer_user_id is not null as followed_by_viewer,
    public_sets.created_at,
    public_sets.updated_at
  from public_sets
  left join public.profiles on profiles.id = public_sets.user_id
  left join lateral (
    select count(*)::bigint as follower_count
    from public.community_set_follows
    where community_set_follows.set_id = public_sets.id
  ) follow_counts on true
  left join public.community_set_follows viewer_follow
    on viewer_follow.set_id = public_sets.id
    and viewer_follow.viewer_user_id = (select auth.uid())
  order by public_sets.updated_at desc, public_sets.id asc;
$$;

drop policy if exists "community_user_follows_insert_own" on public.community_user_follows;
drop policy if exists "community_user_follows_delete_own" on public.community_user_follows;
revoke insert, delete on public.community_user_follows from authenticated;

revoke execute on function public.cardmagic_can_follow_community_set(uuid) from public;
revoke execute on function public.community_set_directory(integer, integer) from public;
grant execute on function public.cardmagic_can_follow_community_set(uuid) to authenticated;
grant execute on function public.community_set_directory(integer, integer) to anon, authenticated;

grant select, insert, delete on public.community_set_follows to authenticated;
grant select on public.community_notifications to authenticated;
grant update (read_at) on public.community_notifications to authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
