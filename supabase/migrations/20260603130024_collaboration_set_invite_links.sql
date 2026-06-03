create table if not exists public.collaboration_set_invite_links (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.card_sets(id) on delete cascade,
  invite_code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  role text not null default 'editor',
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  last_redeemed_at timestamptz,
  redemption_count integer not null default 0,
  constraint collaboration_set_invite_links_code_format check (invite_code ~ '^[a-f0-9]{32}$'),
  constraint collaboration_set_invite_links_role_check check (role in ('editor')),
  constraint collaboration_set_invite_links_redemption_count_check check (redemption_count >= 0)
);

create index if not exists collaboration_set_invite_links_set_created_idx
on public.collaboration_set_invite_links (set_id, created_at desc);

create index if not exists collaboration_set_invite_links_active_idx
on public.collaboration_set_invite_links (invite_code)
where revoked_at is null;

alter table public.collaboration_set_invite_links enable row level security;

drop policy if exists "collaboration_set_invite_links_select_managers" on public.collaboration_set_invite_links;
create policy "collaboration_set_invite_links_select_managers"
on public.collaboration_set_invite_links
for select
to authenticated
using (public.cardmagic_can_manage_set_collaboration(set_id));

revoke all on table public.collaboration_set_invite_links from public;
revoke all on table public.collaboration_set_invite_links from anon;
grant select on public.collaboration_set_invite_links to authenticated;

create or replace function public.create_collaboration_set_invite_link(p_set_id uuid)
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
declare
  v_user_id uuid := (select auth.uid());
  v_set_name text;
  v_invite_code text;
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
        'editor'
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
    'editor'::text,
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
declare
  v_user_id uuid := (select auth.uid());
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_invite_code text := lower(trim(coalesce(p_invite_code, '')));
  v_link public.collaboration_set_invite_links%rowtype;
  v_set_name text;
  v_owner_user_id uuid;
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
      v_link.role,
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
    case when v_owner_user_id = v_user_id then 'owner' else v_link.role end;
end;
$$;

revoke execute on function public.create_collaboration_set_invite_link(uuid) from public;
revoke execute on function public.create_collaboration_set_invite_link(uuid) from anon;
grant execute on function public.create_collaboration_set_invite_link(uuid) to authenticated;

revoke execute on function public.redeem_collaboration_set_invite_link(text) from public;
revoke execute on function public.redeem_collaboration_set_invite_link(text) from anon;
grant execute on function public.redeem_collaboration_set_invite_link(text) to authenticated;

select pg_notify('pgrst', 'reload schema');
