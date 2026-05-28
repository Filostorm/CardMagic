begin;

alter table public.card_sets
add column if not exists id_uuid uuid;

update public.card_sets
set id_uuid = gen_random_uuid()
where id_uuid is null;

alter table public.card_sets
alter column id_uuid set not null;

insert into public.cards (
  id,
  user_id,
  local_snapshot_id,
  name,
  type_line,
  rarity,
  colors,
  frame_treatment,
  image_url,
  card,
  visibility,
  created_at,
  updated_at
)
select
  cs.user_id::text || ':' || (snapshot.value->>'id'),
  cs.user_id,
  snapshot.value->>'id',
  coalesce(snapshot.value->'card'->>'name', ''),
  coalesce(snapshot.value->'card'->>'typeLine', ''),
  snapshot.value->'card'->>'rarity',
  coalesce(
    array(
      select jsonb_array_elements_text(
        case
          when jsonb_typeof(snapshot.value->'card'->'frameColors') = 'array'
            then snapshot.value->'card'->'frameColors'
          else '[]'::jsonb
        end
      )
    ),
    '{}'::text[]
  ),
  snapshot.value->'card'->>'frameTreatment',
  null,
  snapshot.value->'card',
  'public',
  coalesce((snapshot.value->>'savedAt')::timestamptz, cs.created_at, now()),
  now()
from public.card_sets cs
cross join lateral jsonb_array_elements(coalesce(cs.cards, '[]'::jsonb)) with ordinality as snapshot(value, position)
where snapshot.value ? 'id'
  and snapshot.value ? 'card'
  and jsonb_typeof(snapshot.value->'card') = 'object'
on conflict (id) do update set
  user_id = excluded.user_id,
  local_snapshot_id = excluded.local_snapshot_id,
  name = excluded.name,
  type_line = excluded.type_line,
  rarity = excluded.rarity,
  colors = excluded.colors,
  frame_treatment = excluded.frame_treatment,
  card = excluded.card,
  updated_at = now();

alter table public.card_set_cards
add column if not exists set_id_uuid uuid;

insert into public.card_set_cards (
  user_id,
  set_id,
  card_id,
  position,
  created_at,
  updated_at
)
select
  cs.user_id,
  cs.id,
  cs.user_id::text || ':' || (snapshot.value->>'id'),
  (snapshot.position - 1)::integer,
  coalesce((snapshot.value->>'savedAt')::timestamptz, cs.created_at, now()),
  now()
from public.card_sets cs
cross join lateral jsonb_array_elements(coalesce(cs.cards, '[]'::jsonb)) with ordinality as snapshot(value, position)
where snapshot.value ? 'id'
  and snapshot.value ? 'card'
  and jsonb_typeof(snapshot.value->'card') = 'object'
on conflict (user_id, set_id, card_id) do update set
  position = excluded.position,
  updated_at = now();

update public.card_set_cards csc
set set_id_uuid = cs.id_uuid
from public.card_sets cs
where csc.user_id = cs.user_id
  and csc.set_id = cs.id
  and csc.set_id_uuid is null;

delete from public.card_set_cards
where set_id_uuid is null;

alter table public.card_set_cards
drop constraint if exists card_set_cards_user_id_set_id_fkey;

alter table public.card_set_cards
drop constraint if exists card_set_cards_pkey;

alter table public.card_sets
drop constraint if exists card_sets_pkey;

alter table public.card_sets
drop constraint if exists card_sets_id_not_empty;

alter table public.card_sets
drop constraint if exists card_sets_cards_is_array;

alter table public.card_sets
rename column id to legacy_text_id;

alter table public.card_sets
rename column id_uuid to id;

alter table public.card_set_cards
rename column set_id to legacy_set_id;

alter table public.card_set_cards
rename column set_id_uuid to set_id;

alter table public.card_set_cards
alter column set_id set not null;

alter table public.card_sets
add constraint card_sets_pkey primary key (id);

alter table public.card_sets
add constraint card_sets_user_id_id_key unique (user_id, id);

alter table public.card_set_cards
add constraint card_set_cards_pkey primary key (user_id, set_id, card_id);

alter table public.card_set_cards
add constraint card_set_cards_user_id_set_id_fkey
foreign key (user_id, set_id)
references public.card_sets(user_id, id)
on delete cascade;

drop index if exists public.card_set_cards_set_position_idx;

create index if not exists card_set_cards_set_position_idx
on public.card_set_cards (user_id, set_id, position);

alter table public.card_sets
drop column if exists cards;

alter table public.card_sets
drop column if exists legacy_text_id;

alter table public.card_set_cards
drop column if exists legacy_set_id;

select pg_notify('pgrst', 'reload schema');

commit;
