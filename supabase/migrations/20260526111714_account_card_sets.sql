create table if not exists public.card_sets (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  card_back_id text,
  cards jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint card_sets_id_not_empty check (length(trim(id)) > 0),
  constraint card_sets_name_not_empty check (length(trim(name)) > 0),
  constraint card_sets_cards_is_array check (jsonb_typeof(cards) = 'array')
);

alter table public.card_sets enable row level security;

drop policy if exists "card_sets_select_own" on public.card_sets;
create policy "card_sets_select_own"
on public.card_sets
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "card_sets_insert_own" on public.card_sets;
create policy "card_sets_insert_own"
on public.card_sets
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "card_sets_update_own" on public.card_sets;
create policy "card_sets_update_own"
on public.card_sets
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "card_sets_delete_own" on public.card_sets;
create policy "card_sets_delete_own"
on public.card_sets
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop trigger if exists card_sets_touch_updated_at on public.card_sets;
create trigger card_sets_touch_updated_at
before update on public.card_sets
for each row
execute function public.touch_updated_at();

grant select, insert, update, delete on public.card_sets to authenticated;
