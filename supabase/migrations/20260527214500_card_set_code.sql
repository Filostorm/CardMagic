alter table public.card_sets
add column if not exists set_code text;

update public.card_sets
set set_code = upper(left(regexp_replace(name, '[^A-Za-z0-9]+', '', 'g'), 3))
where set_code is null
  and name is not null
  and regexp_replace(name, '[^A-Za-z0-9]+', '', 'g') <> '';
