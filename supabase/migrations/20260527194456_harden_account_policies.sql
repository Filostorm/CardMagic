drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "purchase_events_select_own" on public.stripe_purchase_events;
create policy "purchase_events_select_own"
on public.stripe_purchase_events
for select
to authenticated
using ((select auth.uid()) = user_id);

grant select on public.profiles to authenticated;
grant select on public.stripe_purchase_events to authenticated;

revoke execute on function public.handle_new_user_profile() from public;
revoke execute on function public.handle_new_user_profile() from anon;
revoke execute on function public.handle_new_user_profile() from authenticated;
