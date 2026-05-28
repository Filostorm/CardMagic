create or replace function public.save_user_progress(p_progress jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_progress jsonb := coalesce(p_progress, public.cardmagic_default_progress());
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if jsonb_typeof(v_progress) <> 'object' then
    raise exception 'Progress payload must be a JSON object.';
  end if;

  insert into public.profiles (id, progress)
  values (v_user_id, v_progress)
  on conflict (id)
  do update set progress = excluded.progress
  returning progress into v_progress;

  return v_progress;
end;
$$;

revoke execute on function public.save_user_progress(jsonb) from public;
revoke execute on function public.save_user_progress(jsonb) from anon;
grant execute on function public.save_user_progress(jsonb) to authenticated;
