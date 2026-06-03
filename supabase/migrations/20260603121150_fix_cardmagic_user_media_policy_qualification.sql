drop policy if exists "Users and collaborators can read account media" on storage.objects;
create policy "Users and collaborators can read account media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cardmagic-user-media'
  and (storage.foldername(objects.name))[1] = 'users'
  and (
    (storage.foldername(objects.name))[2] = (select auth.uid())::text
    or exists (
      select 1
      from public.card_sets
      join public.collaboration_set_members
        on collaboration_set_members.set_id::text = card_sets.id::text
      where card_sets.user_id::text = (storage.foldername(objects.name))[2]
        and collaboration_set_members.user_id = (select auth.uid())
        and collaboration_set_members.status = 'accepted'
    )
  )
);

drop policy if exists "Collaborators can upload set media" on storage.objects;
create policy "Collaborators can upload set media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cardmagic-user-media'
  and (storage.foldername(objects.name))[1] = 'sets'
  and (
    exists (
      select 1
      from public.card_sets
      where card_sets.id::text = (storage.foldername(objects.name))[2]
        and card_sets.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.collaboration_set_members
      where collaboration_set_members.set_id::text = (storage.foldername(objects.name))[2]
        and collaboration_set_members.user_id = (select auth.uid())
        and collaboration_set_members.status = 'accepted'
    )
  )
);

drop policy if exists "Collaborators can read set media" on storage.objects;
create policy "Collaborators can read set media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cardmagic-user-media'
  and (storage.foldername(objects.name))[1] = 'sets'
  and (
    exists (
      select 1
      from public.card_sets
      where card_sets.id::text = (storage.foldername(objects.name))[2]
        and card_sets.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.collaboration_set_members
      where collaboration_set_members.set_id::text = (storage.foldername(objects.name))[2]
        and collaboration_set_members.user_id = (select auth.uid())
        and collaboration_set_members.status = 'accepted'
    )
  )
);
