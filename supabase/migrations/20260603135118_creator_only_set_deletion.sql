create or replace function public.cardmagic_is_set_creator(p_set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.card_sets
    where card_sets.id = p_set_id
      and card_sets.user_id = (select auth.uid())
  );
$$;

drop policy if exists "cards_delete_own" on public.cards;
create policy "cards_delete_own"
on public.cards
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and not exists (
    select 1
    from public.card_set_cards
    join public.card_sets
      on card_sets.user_id = card_set_cards.user_id
      and card_sets.id = card_set_cards.set_id
    where card_set_cards.card_id = cards.id
      and card_sets.user_id <> (select auth.uid())
  )
);

drop policy if exists "card_set_cards_delete_own" on public.card_set_cards;
create policy "card_set_cards_delete_own"
on public.card_set_cards
for delete
to authenticated
using (public.cardmagic_is_set_creator(set_id));

drop policy if exists "card_sets_delete_own" on public.card_sets;
create policy "card_sets_delete_own"
on public.card_sets
for delete
to authenticated
using (public.cardmagic_is_set_creator(id));

revoke execute on function public.cardmagic_is_set_creator(uuid) from public;
revoke execute on function public.cardmagic_is_set_creator(uuid) from anon;
grant execute on function public.cardmagic_is_set_creator(uuid) to authenticated;

select pg_notify('pgrst', 'reload schema');
