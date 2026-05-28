alter table public.card_sets
add column if not exists set_symbol_preset text,
add column if not exists set_symbol_uri text,
add column if not exists set_symbol_uses_rarity_treatment boolean;
