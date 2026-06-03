with canonical_set_images as (
  select distinct on (cards.id)
    cards.id as card_id,
    'https://lfalybddbubnkrbhaafj.supabase.co/storage/v1/object/public/community-card-images/' ||
      objects.name as image_url
  from public.cards
  join public.card_set_cards
    on card_set_cards.card_id = cards.id
  join public.card_sets
    on card_sets.user_id = card_set_cards.user_id
    and card_sets.id = card_set_cards.set_id
  join storage.objects
    on objects.bucket_id = 'community-card-images'
    and objects.name =
      'sets/' ||
      card_sets.id::text ||
      '/cards/' ||
      public.cardmagic_safe_storage_card_id(cards.id) ||
      '.png'
  where cards.image_url is null
  order by cards.id, objects.updated_at desc nulls last, objects.created_at desc nulls last
)
update public.cards
set image_url = canonical_set_images.image_url
from canonical_set_images
where cards.id = canonical_set_images.card_id
  and cards.image_url is null;
