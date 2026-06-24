begin;

alter table public.collaboration_set_invite_links
drop constraint if exists collaboration_set_invite_links_role_check;

alter table public.collaboration_set_invite_links
add constraint collaboration_set_invite_links_role_check check (role in ('editor', 'viewer'));

drop function if exists public.create_collaboration_set_invite_link(uuid);

create or replace function public.create_collaboration_set_invite_link(
  p_set_id uuid,
  p_role text default 'editor'
)
returns table (
  invite_code text,
  set_id uuid,
  set_name text,
  role text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_user_id uuid := (select auth.uid());
  v_set_name text;
  v_invite_code text;
  v_role text := case when lower(trim(coalesce(p_role, 'editor'))) = 'viewer' then 'viewer' else 'editor' end;
begin
  if v_user_id is null then
    raise exception 'Sign in to create collaboration invite links.';
  end if;

  if not public.cardmagic_can_manage_set_collaboration(p_set_id) then
    raise exception 'Only the set owner can create collaboration invite links.';
  end if;

  select card_sets.name into v_set_name
  from public.card_sets
  where card_sets.id = p_set_id;

  if v_set_name is null then
    raise exception 'Set not found.';
  end if;

  loop
    v_invite_code := replace(gen_random_uuid()::text, '-', '');

    begin
      insert into public.collaboration_set_invite_links (
        set_id,
        invite_code,
        created_by,
        role
      )
      values (
        p_set_id,
        v_invite_code,
        v_user_id,
        v_role
      );

      exit;
    exception
      when unique_violation then
        -- Extremely unlikely, but retry so callers never see random-token collisions.
    end;
  end loop;

  return query
  select
    v_invite_code,
    p_set_id,
    v_set_name,
    v_role,
    null::timestamptz;
end;
$$;

create or replace function public.redeem_collaboration_set_invite_link(p_invite_code text)
returns table (
  set_id uuid,
  set_name text,
  owner_user_id uuid,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_user_id uuid := (select auth.uid());
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_invite_code text := lower(trim(coalesce(p_invite_code, '')));
  v_link public.collaboration_set_invite_links%rowtype;
  v_set_name text;
  v_owner_user_id uuid;
  v_actor_name text;
  v_was_accepted boolean := false;
begin
  if v_user_id is null then
    raise exception 'Sign in to accept this set invite.';
  end if;

  if v_invite_code !~ '^[a-f0-9]{32}$' then
    raise exception 'This set invite link is not valid.';
  end if;

  select *
  into v_link
  from public.collaboration_set_invite_links links
  where links.invite_code = v_invite_code
    and links.revoked_at is null
    and (links.expires_at is null or links.expires_at > now())
  limit 1;

  if v_link.id is null then
    raise exception 'This set invite link is not valid or has expired.';
  end if;

  select card_sets.name, card_sets.user_id
  into v_set_name, v_owner_user_id
  from public.card_sets
  where card_sets.id = v_link.set_id;

  if v_owner_user_id is null then
    raise exception 'This set invite link points to a set that no longer exists.';
  end if;

  if v_owner_user_id <> v_user_id then
    if v_link.role = 'viewer' then
      insert into public.community_set_follows (set_id, viewer_user_id)
      values (v_link.set_id, v_user_id)
      on conflict (set_id, viewer_user_id) do nothing;
    else
      select exists (
        select 1
        from public.collaboration_set_members members
        where members.set_id = v_link.set_id
          and members.user_id = v_user_id
          and members.status = 'accepted'
      )
      into v_was_accepted;

      insert into public.collaboration_set_members (
        set_id,
        user_id,
        invited_by,
        role,
        status,
        accepted_at
      )
      values (
        v_link.set_id,
        v_user_id,
        v_link.created_by,
        'editor',
        'accepted',
        now()
      )
      on conflict (set_id, user_id) where user_id is not null
      do update set
        invited_by = coalesce(public.collaboration_set_members.invited_by, excluded.invited_by),
        role = case
          when public.collaboration_set_members.role = 'owner' then 'owner'
          else excluded.role
        end,
        status = 'accepted',
        accepted_at = coalesce(public.collaboration_set_members.accepted_at, now());

      if length(v_email) > 0 then
        delete from public.collaboration_set_members pending_member
        where pending_member.set_id = v_link.set_id
          and pending_member.invited_email = v_email
          and pending_member.status = 'pending'
          and pending_member.user_id is null;
      end if;

      if not v_was_accepted then
        select public.cardmagic_public_author_name(v_user_id, profiles.display_name)
        into v_actor_name
        from public.profiles
        where profiles.id = v_user_id;

        insert into public.community_notifications (
          recipient_user_id,
          actor_user_id,
          set_id,
          kind,
          metadata
        )
        values (
          coalesce(v_link.created_by, v_owner_user_id),
          v_user_id,
          v_link.set_id,
          'collaboration_set_joined',
          jsonb_build_object(
            'setName', coalesce(v_set_name, 'Untitled Set'),
            'actorName', coalesce(v_actor_name, public.cardmagic_public_author_name(v_user_id, null))
          )
        );
      end if;
    end if;
  end if;

  update public.collaboration_set_invite_links
  set
    last_redeemed_at = now(),
    redemption_count = redemption_count + 1
  where id = v_link.id;

  return query
  select
    v_link.set_id,
    v_set_name,
    v_owner_user_id,
    case
      when v_owner_user_id = v_user_id then 'owner'
      when v_link.role = 'viewer' then 'viewer'
      else 'editor'
    end;
end;
$$;

revoke execute on function public.create_collaboration_set_invite_link(uuid, text) from public;
revoke execute on function public.create_collaboration_set_invite_link(uuid, text) from anon;
grant execute on function public.create_collaboration_set_invite_link(uuid, text) to authenticated;

revoke execute on function public.redeem_collaboration_set_invite_link(text) from public;
revoke execute on function public.redeem_collaboration_set_invite_link(text) from anon;
grant execute on function public.redeem_collaboration_set_invite_link(text) to authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
