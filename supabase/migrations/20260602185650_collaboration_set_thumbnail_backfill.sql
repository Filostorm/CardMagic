begin;

create or replace function public.cardmagic_safe_storage_card_id(p_card_id text)
returns text
language sql
immutable
set search_path = public
as $$
  select left(regexp_replace(coalesce(p_card_id, ''), '[^a-zA-Z0-9._-]+', '-', 'g'), 160);
$$;

create or replace function public.cardmagic_can_backfill_set_card_image(
  p_set_id uuid,
  p_card_id text
)
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
    where card_sets.id = p_set_id
      and card_set_cards.card_id = p_card_id
      and (
        public.cardmagic_is_set_collaborator(p_set_id)
        or cards.visibility = 'public'
      )
  );
$$;

create or replace function public.cardmagic_can_backfill_set_card_storage_image(
  p_set_id uuid,
  p_safe_card_id text
)
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
    where card_sets.id = p_set_id
      and public.cardmagic_safe_storage_card_id(card_set_cards.card_id) = p_safe_card_id
      and (
        public.cardmagic_is_set_collaborator(p_set_id)
        or cards.visibility = 'public'
      )
  );
$$;

create or replace function public.attach_collaboration_set_card_image(
  p_set_id uuid,
  p_card_id text,
  p_image_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_image_url text := trim(coalesce(p_image_url, ''));
  v_is_collaborator boolean := false;
  v_expected_public_path text;
begin
  if v_user_id is null then
    raise exception 'Sign in to attach set card thumbnails.';
  end if;

  if length(v_image_url) = 0 or v_image_url !~* '^https?://' then
    raise exception 'Set card thumbnail must be a public HTTP(S) URL.';
  end if;

  v_is_collaborator := public.cardmagic_is_set_collaborator(p_set_id);

  if not public.cardmagic_can_backfill_set_card_image(p_set_id, p_card_id) then
    raise exception 'You cannot attach a rendered image for this set card.';
  end if;

  if not v_is_collaborator then
    v_expected_public_path :=
      '/storage/v1/object/public/community-card-images/sets/' ||
      p_set_id::text ||
      '/cards/' ||
      public.cardmagic_safe_storage_card_id(p_card_id) ||
      '.png';

    if position(v_expected_public_path in v_image_url) = 0 then
      raise exception 'Public set backfills must use the canonical Storage image path.';
    end if;
  end if;

  if not exists (
    select 1
    from public.card_sets
    join public.card_set_cards
      on card_set_cards.user_id = card_sets.user_id
      and card_set_cards.set_id = card_sets.id
    where card_sets.id = p_set_id
      and card_set_cards.card_id = p_card_id
  ) then
    raise exception 'Card is not attached to this set.';
  end if;

  update public.cards
  set image_url = v_image_url
  where id = p_card_id;

  if not found then
    raise exception 'Card not found.';
  end if;
end;
$$;

create or replace function public.cardmagic_storage_set_path_id(p_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_path_parts text[] := storage.foldername(p_name);
begin
  if v_path_parts[1] <> 'sets' or v_path_parts[3] <> 'cards' then
    return null;
  end if;

  return v_path_parts[2]::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.cardmagic_storage_set_path_card_id(p_name text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_path_match text[] := regexp_match(p_name, '^sets/[^/]+/cards/([^/]+)\.png$');
begin
  if v_path_match is null then
    return null;
  end if;

  return v_path_match[1];
end;
$$;

drop policy if exists "Collaborators can upload shared set card images" on storage.objects;
drop policy if exists "Authorized viewers can upload shared set card images" on storage.objects;
create policy "Authorized viewers can upload shared set card images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-card-images'
  and public.cardmagic_can_backfill_set_card_storage_image(
    public.cardmagic_storage_set_path_id(name),
    public.cardmagic_storage_set_path_card_id(name)
  )
);

drop policy if exists "Collaborators can update shared set card images" on storage.objects;
drop policy if exists "Authorized viewers can update shared set card images" on storage.objects;
create policy "Authorized viewers can update shared set card images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'community-card-images'
  and public.cardmagic_can_backfill_set_card_storage_image(
    public.cardmagic_storage_set_path_id(name),
    public.cardmagic_storage_set_path_card_id(name)
  )
)
with check (
  bucket_id = 'community-card-images'
  and public.cardmagic_can_backfill_set_card_storage_image(
    public.cardmagic_storage_set_path_id(name),
    public.cardmagic_storage_set_path_card_id(name)
  )
);

revoke execute on function public.attach_collaboration_set_card_image(uuid, text, text) from public;
revoke execute on function public.attach_collaboration_set_card_image(uuid, text, text) from anon;
grant execute on function public.attach_collaboration_set_card_image(uuid, text, text) to authenticated;
revoke execute on function public.cardmagic_safe_storage_card_id(text) from public;
revoke execute on function public.cardmagic_safe_storage_card_id(text) from anon;
grant execute on function public.cardmagic_safe_storage_card_id(text) to authenticated;
revoke execute on function public.cardmagic_can_backfill_set_card_image(uuid, text) from public;
revoke execute on function public.cardmagic_can_backfill_set_card_image(uuid, text) from anon;
grant execute on function public.cardmagic_can_backfill_set_card_image(uuid, text) to authenticated;
revoke execute on function public.cardmagic_can_backfill_set_card_storage_image(uuid, text) from public;
revoke execute on function public.cardmagic_can_backfill_set_card_storage_image(uuid, text) from anon;
grant execute on function public.cardmagic_can_backfill_set_card_storage_image(uuid, text) to authenticated;
revoke execute on function public.cardmagic_storage_set_path_id(text) from public;
revoke execute on function public.cardmagic_storage_set_path_id(text) from anon;
grant execute on function public.cardmagic_storage_set_path_id(text) to authenticated;
revoke execute on function public.cardmagic_storage_set_path_card_id(text) from public;
revoke execute on function public.cardmagic_storage_set_path_card_id(text) from anon;
grant execute on function public.cardmagic_storage_set_path_card_id(text) to authenticated;

commit;
