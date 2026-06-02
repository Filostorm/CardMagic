create or replace function public.collaboration_set_member_list(p_set_id uuid)
returns table (
  id uuid,
  user_id uuid,
  role text,
  username text,
  display_name text,
  member_name text,
  accepted_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    members.id,
    members.user_id,
    members.role,
    profiles.username,
    profiles.display_name,
    coalesce(
      case
        when nullif(trim(profiles.username), '') is not null then '@' || trim(profiles.username)
        else null
      end,
      nullif(trim(profiles.display_name), ''),
      public.cardmagic_public_author_name(members.user_id, profiles.display_name)
    ) as member_name,
    members.accepted_at,
    members.created_at
  from public.collaboration_set_members members
  left join public.profiles on profiles.id = members.user_id
  where public.cardmagic_is_set_collaborator(p_set_id)
    and members.set_id = p_set_id
    and members.status = 'accepted'
    and members.user_id is not null
  order by
    case members.role when 'owner' then 0 else 1 end,
    coalesce(profiles.display_name, profiles.username, members.user_id::text) asc;
$$;

revoke execute on function public.collaboration_set_member_list(uuid) from public;
revoke execute on function public.collaboration_set_member_list(uuid) from anon;
grant execute on function public.collaboration_set_member_list(uuid) to authenticated;
