alter table public.profiles
add column if not exists username text;

create unique index if not exists profiles_username_lower_key
on public.profiles (lower(username))
where username is not null;

alter table public.profiles
drop constraint if exists profiles_username_format_check;

alter table public.profiles
add constraint profiles_username_format_check
check (
  username is null
  or (
    char_length(username) between 3 and 24
    and username ~ '^[A-Za-z0-9_]+$'
  )
);

create or replace function public.cardmagic_public_author_name(p_user_id uuid, p_display_name text)
returns text
language sql
stable
as $$
  select coalesce(nullif(trim(p_display_name), ''), 'Creator ' || upper(left(replace(p_user_id::text, '-', ''), 6)));
$$;

create or replace function public.set_profile_username(p_username text)
returns table (
  username text,
  display_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_username text := nullif(trim(p_username), '');
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_username is not null then
    v_username := regexp_replace(v_username, '[^A-Za-z0-9_]', '', 'g');

    if char_length(v_username) < 3 or char_length(v_username) > 24 then
      raise exception 'Username must be 3-24 characters.';
    end if;
  end if;

  insert into public.profiles (id, username, display_name)
  values (v_user_id, v_username, v_username)
  on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name;

  return query
  select profiles.username, profiles.display_name
  from public.profiles
  where profiles.id = v_user_id;
end;
$$;

create or replace function public.set_profile_display_name(p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_display_name text := left(nullif(trim(p_display_name), ''), 60);
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, display_name)
  values (v_user_id, v_display_name)
  on conflict (id) do update set
    display_name = coalesce(public.profiles.username, excluded.display_name);
end;
$$;

revoke execute on function public.set_profile_username(text) from public;
grant execute on function public.set_profile_username(text) to authenticated;

select pg_notify('pgrst', 'reload schema');
