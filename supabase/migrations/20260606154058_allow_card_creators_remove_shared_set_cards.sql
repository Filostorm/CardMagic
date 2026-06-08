create or replace function public.cardmagic_can_remove_set_card(
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
        card_sets.user_id = (select auth.uid())
        or cards.user_id = (select auth.uid())
      )
  );
$$;

create or replace function public.remove_collaboration_set_card(
  p_set_id uuid,
  p_card_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_set_owner_user_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to remove cards from collaborative sets.';
  end if;

  if not public.cardmagic_can_remove_set_card(p_set_id, p_card_id) then
    raise exception 'Only the set creator or card creator can remove this card from the set.';
  end if;

  select user_id into v_set_owner_user_id
  from public.card_sets
  where id = p_set_id;

  if v_set_owner_user_id is null then
    raise exception 'Set not found.';
  end if;

  delete from public.card_set_cards
  where user_id = v_set_owner_user_id
    and set_id = p_set_id
    and card_id = p_card_id;

  if not found then
    raise exception 'Card is not in this set.';
  end if;
end;
$$;

drop policy if exists "card_set_cards_delete_own" on public.card_set_cards;
create policy "card_set_cards_delete_own"
on public.card_set_cards
for delete
to authenticated
using (public.cardmagic_can_remove_set_card(set_id, card_id));

revoke execute on function public.cardmagic_can_remove_set_card(uuid, text) from public;
revoke execute on function public.cardmagic_can_remove_set_card(uuid, text) from anon;
grant execute on function public.cardmagic_can_remove_set_card(uuid, text) to authenticated;

revoke execute on function public.remove_collaboration_set_card(uuid, text) from public;
revoke execute on function public.remove_collaboration_set_card(uuid, text) from anon;
grant execute on function public.remove_collaboration_set_card(uuid, text) to authenticated;

select pg_notify('pgrst', 'reload schema');
