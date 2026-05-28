create table if not exists public.cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_snapshot_id text,
  name text not null default '',
  type_line text not null default '',
  rarity text,
  colors text[] not null default '{}'::text[],
  frame_treatment text,
  image_url text,
  card jsonb not null,
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_id_not_empty check (length(trim(id)) > 0),
  constraint cards_card_is_object check (jsonb_typeof(card) = 'object'),
  constraint cards_visibility_check check (visibility in ('public', 'unlisted', 'private')),
  constraint cards_unique_local_snapshot unique (user_id, local_snapshot_id)
);

create index if not exists cards_visibility_created_at_idx
on public.cards (visibility, created_at desc);

create index if not exists cards_user_updated_at_idx
on public.cards (user_id, updated_at desc);

create table if not exists public.card_set_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id text not null,
  card_id text not null references public.cards(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, set_id, card_id),
  foreign key (user_id, set_id) references public.card_sets(user_id, id) on delete cascade,
  constraint card_set_cards_position_nonnegative check (position >= 0)
);

create index if not exists card_set_cards_card_id_idx
on public.card_set_cards (card_id);

create index if not exists card_set_cards_set_position_idx
on public.card_set_cards (user_id, set_id, position);

alter table public.cards enable row level security;
alter table public.card_set_cards enable row level security;

drop trigger if exists cards_touch_updated_at on public.cards;
create trigger cards_touch_updated_at
before update on public.cards
for each row
execute function public.touch_updated_at();

drop trigger if exists card_set_cards_touch_updated_at on public.card_set_cards;
create trigger card_set_cards_touch_updated_at
before update on public.card_set_cards
for each row
execute function public.touch_updated_at();

drop policy if exists "cards_select_public_or_own" on public.cards;
create policy "cards_select_public_or_own"
on public.cards
for select
to anon, authenticated
using (visibility = 'public' or (select auth.uid()) = user_id);

drop policy if exists "cards_insert_own" on public.cards;
create policy "cards_insert_own"
on public.cards
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "cards_update_own" on public.cards;
create policy "cards_update_own"
on public.cards
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "cards_delete_own" on public.cards;
create policy "cards_delete_own"
on public.cards
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "card_set_cards_select_own" on public.card_set_cards;
create policy "card_set_cards_select_own"
on public.card_set_cards
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "card_set_cards_insert_own" on public.card_set_cards;
create policy "card_set_cards_insert_own"
on public.card_set_cards
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "card_set_cards_update_own" on public.card_set_cards;
create policy "card_set_cards_update_own"
on public.card_set_cards
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "card_set_cards_delete_own" on public.card_set_cards;
create policy "card_set_cards_delete_own"
on public.card_set_cards
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select on public.cards to anon, authenticated;
grant insert, update, delete on public.cards to authenticated;
grant select, insert, update, delete on public.card_set_cards to authenticated;
