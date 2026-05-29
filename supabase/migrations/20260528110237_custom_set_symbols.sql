create table if not exists public.custom_set_symbols (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  uri text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_set_symbols_label_not_empty check (length(trim(label)) > 0),
  constraint custom_set_symbols_uri_not_empty check (length(trim(uri)) > 0)
);

create unique index if not exists custom_set_symbols_user_id_id_key
on public.custom_set_symbols (user_id, id);

create index if not exists custom_set_symbols_user_created_idx
on public.custom_set_symbols (user_id, created_at desc);

alter table public.custom_set_symbols enable row level security;

drop policy if exists "custom_set_symbols_select_own" on public.custom_set_symbols;
create policy "custom_set_symbols_select_own"
on public.custom_set_symbols
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "custom_set_symbols_insert_own" on public.custom_set_symbols;
create policy "custom_set_symbols_insert_own"
on public.custom_set_symbols
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "custom_set_symbols_update_own" on public.custom_set_symbols;
create policy "custom_set_symbols_update_own"
on public.custom_set_symbols
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "custom_set_symbols_delete_own" on public.custom_set_symbols;
create policy "custom_set_symbols_delete_own"
on public.custom_set_symbols
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop trigger if exists custom_set_symbols_touch_updated_at on public.custom_set_symbols;
create trigger custom_set_symbols_touch_updated_at
before update on public.custom_set_symbols
for each row execute function public.touch_updated_at();

grant select, insert, update, delete on public.custom_set_symbols to authenticated;

alter table public.card_sets
add column if not exists set_symbol_id uuid;

alter table public.card_sets
drop constraint if exists card_sets_user_set_symbol_fkey;

alter table public.card_sets
add constraint card_sets_user_set_symbol_fkey
foreign key (user_id, set_symbol_id)
references public.custom_set_symbols(user_id, id);
