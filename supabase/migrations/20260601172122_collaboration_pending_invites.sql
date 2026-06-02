begin;

create or replace function public.collaboration_set_pending_invites(p_set_id uuid)
returns table (
  id uuid,
  invited_email text,
  role text,
  created_at timestamptz
)
language sql
security invoker
set search_path = public
as $$
  select
    members.id,
    members.invited_email,
    members.role,
    members.created_at
  from public.collaboration_set_members as members
  where (select auth.uid()) is not null
    and public.cardmagic_can_manage_set_collaboration(p_set_id)
    and members.set_id = p_set_id
    and members.status = 'pending'
    and members.invited_email is not null
  order by members.created_at desc
  limit 50;
$$;

revoke execute on function public.collaboration_set_pending_invites(uuid) from public;
revoke execute on function public.collaboration_set_pending_invites(uuid) from anon;
grant execute on function public.collaboration_set_pending_invites(uuid) to authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
