create table if not exists public.card_set_deletion_tombstones (
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid not null,
  deleted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, set_id)
);

create table if not exists public.card_deletion_tombstones (
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid not null,
  card_id text not null,
  deleted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, set_id, card_id),
  constraint card_deletion_tombstones_card_id_not_empty check (length(trim(card_id)) > 0)
);

create index if not exists card_set_deletion_tombstones_user_deleted_at_idx
on public.card_set_deletion_tombstones (user_id, deleted_at desc);

create index if not exists card_deletion_tombstones_user_deleted_at_idx
on public.card_deletion_tombstones (user_id, deleted_at desc);

alter table public.card_set_deletion_tombstones enable row level security;
alter table public.card_deletion_tombstones enable row level security;

drop trigger if exists card_set_deletion_tombstones_touch_updated_at on public.card_set_deletion_tombstones;
create trigger card_set_deletion_tombstones_touch_updated_at
before update on public.card_set_deletion_tombstones
for each row
execute function public.touch_updated_at();

drop trigger if exists card_deletion_tombstones_touch_updated_at on public.card_deletion_tombstones;
create trigger card_deletion_tombstones_touch_updated_at
before update on public.card_deletion_tombstones
for each row
execute function public.touch_updated_at();

drop policy if exists "card_set_deletion_tombstones_select_own" on public.card_set_deletion_tombstones;
create policy "card_set_deletion_tombstones_select_own"
on public.card_set_deletion_tombstones
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "card_set_deletion_tombstones_insert_own" on public.card_set_deletion_tombstones;
create policy "card_set_deletion_tombstones_insert_own"
on public.card_set_deletion_tombstones
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "card_set_deletion_tombstones_update_own" on public.card_set_deletion_tombstones;
create policy "card_set_deletion_tombstones_update_own"
on public.card_set_deletion_tombstones
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "card_set_deletion_tombstones_delete_own" on public.card_set_deletion_tombstones;
create policy "card_set_deletion_tombstones_delete_own"
on public.card_set_deletion_tombstones
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "card_deletion_tombstones_select_own" on public.card_deletion_tombstones;
create policy "card_deletion_tombstones_select_own"
on public.card_deletion_tombstones
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "card_deletion_tombstones_insert_own" on public.card_deletion_tombstones;
create policy "card_deletion_tombstones_insert_own"
on public.card_deletion_tombstones
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "card_deletion_tombstones_update_own" on public.card_deletion_tombstones;
create policy "card_deletion_tombstones_update_own"
on public.card_deletion_tombstones
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "card_deletion_tombstones_delete_own" on public.card_deletion_tombstones;
create policy "card_deletion_tombstones_delete_own"
on public.card_deletion_tombstones
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.card_set_deletion_tombstones to authenticated;
grant select, insert, update, delete on public.card_deletion_tombstones to authenticated;

select pg_notify('pgrst', 'reload schema');
