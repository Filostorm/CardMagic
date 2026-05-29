begin;

with main_sets as (
  select
    cs.user_id,
    cs.id,
    cs.created_at,
    cs.updated_at,
    count(csc.card_id) as card_count
  from public.card_sets as cs
  left join public.card_set_cards as csc
    on csc.user_id = cs.user_id
   and csc.set_id = cs.id
  where lower(regexp_replace(trim(cs.name), '\s+', ' ', 'g')) = 'main set'
  group by cs.user_id, cs.id, cs.created_at, cs.updated_at
),
canonical_main_sets as (
  select distinct on (user_id)
    user_id,
    id as canonical_id
  from main_sets
  order by
    user_id,
    card_count desc,
    updated_at desc nulls last,
    created_at asc nulls last,
    id asc
),
duplicate_main_sets as (
  select
    main_sets.user_id,
    main_sets.id as duplicate_id,
    canonical_main_sets.canonical_id
  from main_sets
  join canonical_main_sets
    on canonical_main_sets.user_id = main_sets.user_id
  where main_sets.id <> canonical_main_sets.canonical_id
),
moved_memberships as (
  insert into public.card_set_cards (
    user_id,
    set_id,
    card_id,
    position,
    created_at,
    updated_at
  )
  select
    csc.user_id,
    duplicate_main_sets.canonical_id,
    csc.card_id,
    csc.position,
    csc.created_at,
    now()
  from public.card_set_cards as csc
  join duplicate_main_sets
    on duplicate_main_sets.user_id = csc.user_id
   and duplicate_main_sets.duplicate_id = csc.set_id
  on conflict (user_id, set_id, card_id) do update set
    position = least(public.card_set_cards.position, excluded.position),
    updated_at = greatest(public.card_set_cards.updated_at, excluded.updated_at)
  returning 1
)
delete from public.card_sets as cs
using duplicate_main_sets
where cs.user_id = duplicate_main_sets.user_id
  and cs.id = duplicate_main_sets.duplicate_id;

create unique index if not exists card_sets_one_default_main_set_per_user_idx
on public.card_sets (user_id)
where lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = 'main set';

select pg_notify('pgrst', 'reload schema');

commit;
