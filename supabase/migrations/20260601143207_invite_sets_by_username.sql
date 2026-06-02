begin;

drop function if exists public.invite_collaboration_set_member(uuid, text);

create function public.invite_collaboration_set_member(p_set_id uuid, p_invite_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inviter_id uuid := (select auth.uid());
  v_invite_identifier text := trim(coalesce(p_invite_identifier, ''));
  v_email text;
  v_username text;
  v_target_user_id uuid;
begin
  if v_inviter_id is null then
    raise exception 'Sign in to invite collaborators.';
  end if;

  if not public.cardmagic_can_manage_set_collaboration(p_set_id) then
    raise exception 'Only the set owner can invite collaborators.';
  end if;

  if length(v_invite_identifier) = 0 then
    raise exception 'Enter an email address or username.';
  end if;

  if v_invite_identifier ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    v_email := lower(v_invite_identifier);

    if v_email = lower(coalesce(auth.jwt() ->> 'email', '')) then
      raise exception 'You are already a collaborator on this set.';
    end if;

    insert into public.collaboration_set_members (set_id, invited_email, invited_by, role, status)
    values (p_set_id, v_email, v_inviter_id, 'editor', 'pending')
    on conflict do nothing;

    return;
  end if;

  v_username := regexp_replace(v_invite_identifier, '^@+', '');

  if v_username !~ '^[A-Za-z0-9_]{3,24}$' then
    raise exception 'Enter a valid email address or 3-24 character username.';
  end if;

  select profiles.id into v_target_user_id
  from public.profiles
  where lower(profiles.username) = lower(v_username)
  limit 1;

  if v_target_user_id is null then
    raise exception 'No CardMagic user found with that username.';
  end if;

  if v_target_user_id = v_inviter_id then
    raise exception 'You are already a collaborator on this set.';
  end if;

  insert into public.collaboration_set_members (set_id, user_id, invited_by, role, status, accepted_at)
  values (p_set_id, v_target_user_id, v_inviter_id, 'editor', 'accepted', now())
  on conflict do nothing;
end;
$$;

revoke execute on function public.invite_collaboration_set_member(uuid, text) from public;
revoke execute on function public.invite_collaboration_set_member(uuid, text) from anon;
grant execute on function public.invite_collaboration_set_member(uuid, text) to authenticated;

drop policy if exists "collaboration_set_members_select_related" on public.collaboration_set_members;
create policy "collaboration_set_members_select_related"
on public.collaboration_set_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or invited_email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  or public.cardmagic_can_manage_set_collaboration(set_id)
);

select pg_notify('pgrst', 'reload schema');

commit;
