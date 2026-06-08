create or replace function public.cardmagic_can_read_user_media(p_owner_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_owner_user_id = (select auth.uid())
  or exists (
    select 1
    from public.card_sets
    join public.collaboration_set_members
      on collaboration_set_members.set_id = card_sets.id
    where card_sets.user_id = p_owner_user_id
      and collaboration_set_members.user_id = (select auth.uid())
      and collaboration_set_members.status = 'accepted'
  );
$$;

create or replace function public.cardmagic_can_read_set_media(p_set_id uuid)
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
  )
  or exists (
    select 1
    from public.collaboration_set_members
    where collaboration_set_members.set_id = p_set_id
      and collaboration_set_members.user_id = (select auth.uid())
      and collaboration_set_members.status = 'accepted'
  );
$$;

revoke execute on function public.cardmagic_can_read_user_media(uuid) from public;
revoke execute on function public.cardmagic_can_read_user_media(uuid) from anon;
grant execute on function public.cardmagic_can_read_user_media(uuid) to authenticated;

revoke execute on function public.cardmagic_can_read_set_media(uuid) from public;
revoke execute on function public.cardmagic_can_read_set_media(uuid) from anon;
grant execute on function public.cardmagic_can_read_set_media(uuid) to authenticated;

drop policy if exists "Users and collaborators can read account media" on storage.objects;
create policy "Users and collaborators can read account media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cardmagic-user-media'
  and (storage.foldername(objects.name))[1] = 'users'
  and (storage.foldername(objects.name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.cardmagic_can_read_user_media(((storage.foldername(objects.name))[2])::uuid)
);

drop policy if exists "Collaborators can read set media" on storage.objects;
create policy "Collaborators can read set media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cardmagic-user-media'
  and (storage.foldername(objects.name))[1] = 'sets'
  and (storage.foldername(objects.name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.cardmagic_can_read_set_media(((storage.foldername(objects.name))[2])::uuid)
);

drop policy if exists "Collaborators can upload set media" on storage.objects;
create policy "Collaborators can upload set media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cardmagic-user-media'
  and (storage.foldername(objects.name))[1] = 'sets'
  and (storage.foldername(objects.name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.cardmagic_can_read_set_media(((storage.foldername(objects.name))[2])::uuid)
);
