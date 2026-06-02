begin;

create or replace function public.invite_collaboration_set_member(p_set_id uuid, p_invite_identifier text)
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
  v_normalized_username text;
  v_target_user_id uuid;
  v_target_count integer;
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
  v_normalized_username := regexp_replace(v_username, '[^A-Za-z0-9_]', '', 'g');

  if v_normalized_username !~ '^[A-Za-z0-9_]{3,24}$' then
    raise exception 'Enter a valid email address or 3-24 character username.';
  end if;

  select count(*)::integer
    into v_target_count
  from public.profiles
  where lower(profiles.username) = lower(v_normalized_username);

  select profiles.id
    into v_target_user_id
  from public.profiles
  where lower(profiles.username) = lower(v_normalized_username)
  order by profiles.id::text
  limit 1;

  if coalesce(v_target_count, 0) = 0 then
    with matches as (
      select auth.users.id
      from auth.users
      where auth.users.email is not null
        and lower(regexp_replace(split_part(auth.users.email, '@', 1), '[^A-Za-z0-9_]', '', 'g')) = lower(v_normalized_username)
    )
    select count(*)::integer
      into v_target_count
    from matches;

    with matches as (
      select auth.users.id
      from auth.users
      where auth.users.email is not null
        and lower(regexp_replace(split_part(auth.users.email, '@', 1), '[^A-Za-z0-9_]', '', 'g')) = lower(v_normalized_username)
    )
    select matches.id
      into v_target_user_id
    from matches
    order by matches.id::text
    limit 1;
  end if;

  if coalesce(v_target_count, 0) = 0 then
    raise exception 'No CardMagic user found with that username or email prefix.';
  end if;

  if v_target_count > 1 then
    raise exception 'Multiple CardMagic users match that email prefix. Invite by full email address.';
  end if;

  if v_target_user_id = v_inviter_id then
    raise exception 'You are already a collaborator on this set.';
  end if;

  insert into public.collaboration_set_members (set_id, user_id, invited_by, role, status, accepted_at)
  values (p_set_id, v_target_user_id, v_inviter_id, 'editor', 'accepted', now())
  on conflict do nothing;
end;
$$;

create or replace function public.search_collaboration_invite_profiles(
  p_query text,
  p_limit integer default 8
)
returns table (
  user_id uuid,
  username text,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select regexp_replace(regexp_replace(trim(coalesce(p_query, '')), '^@+', ''), '[^A-Za-z0-9_]', '', 'g') as query
  ),
  profile_candidates as (
    select
      auth.users.id as user_id,
      coalesce(
        profiles.username,
        nullif(regexp_replace(split_part(auth.users.email, '@', 1), '[^A-Za-z0-9_]', '', 'g'), '')
      ) as username,
      profiles.display_name,
      lower(coalesce(profiles.username, '')) as explicit_username,
      lower(regexp_replace(coalesce(split_part(auth.users.email, '@', 1), ''), '[^A-Za-z0-9_]', '', 'g')) as email_local_part
    from auth.users
    left join public.profiles
      on profiles.id = auth.users.id
  )
  select
    profile_candidates.user_id,
    profile_candidates.username,
    profile_candidates.display_name
  from profile_candidates
  cross join normalized
  where (select auth.uid()) is not null
    and profile_candidates.user_id <> (select auth.uid())
    and profile_candidates.username is not null
    and char_length(normalized.query) >= 2
    and (
      profile_candidates.explicit_username like lower(normalized.query) || '%'
      or profile_candidates.email_local_part like lower(normalized.query) || '%'
    )
  order by
    profile_candidates.explicit_username = lower(normalized.query) desc,
    profile_candidates.email_local_part = lower(normalized.query) desc,
    profile_candidates.explicit_username like lower(normalized.query) || '%' desc,
    lower(profile_candidates.username) asc
  limit greatest(1, least(coalesce(p_limit, 8), 12));
$$;

revoke execute on function public.invite_collaboration_set_member(uuid, text) from public;
revoke execute on function public.invite_collaboration_set_member(uuid, text) from anon;
grant execute on function public.invite_collaboration_set_member(uuid, text) to authenticated;

revoke execute on function public.search_collaboration_invite_profiles(text, integer) from public;
revoke execute on function public.search_collaboration_invite_profiles(text, integer) from anon;
grant execute on function public.search_collaboration_invite_profiles(text, integer) to authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
