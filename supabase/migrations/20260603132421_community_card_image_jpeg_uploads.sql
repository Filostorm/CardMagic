insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-card-images',
  'community-card-images',
  true,
  5242880,
  array['image/png', 'image/jpeg']::text[]
)
on conflict (id) do nothing;

update storage.buckets
set
  public = true,
  file_size_limit = greatest(coalesce(file_size_limit, 0), 5242880),
  allowed_mime_types = (
    select array_agg(distinct mime_type order by mime_type)
    from unnest(
      coalesce(allowed_mime_types, '{}'::text[]) ||
      array['image/png', 'image/jpeg']::text[]
    ) as mime_type
  )
where id = 'community-card-images';
