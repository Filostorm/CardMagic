create index if not exists cards_public_updated_at_idx
on public.cards (updated_at desc)
where visibility = 'public';
