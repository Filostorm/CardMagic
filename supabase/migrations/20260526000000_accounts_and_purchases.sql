create or replace function public.cardmagic_default_progress()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'schemaVersion', 1,
    'credits', 40,
    'lifetimeCreditsPurchased', 40,
    'lifetimeLevelCreditsEarned', 0,
    'highestRewardedLevel', 1,
    'lifetimeXpEarned', 0,
    'subscribedMonthly', false,
    'completedAchievementIds', '[]'::jsonb,
    'counters', jsonb_build_object(
      'uploadedImages', 0,
      'generatedImages', 0,
      'uploadedSetIcons', 0,
      'fixedRulesTexts', 0,
      'savedCards', 0,
      'createdSets', 0,
      'exportedCards', 0,
      'exportedSets', 0
    )
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default public.cardmagic_default_progress(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create table if not exists public.stripe_purchase_events (
  stripe_event_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

alter table public.stripe_purchase_events enable row level security;

drop policy if exists "purchase_events_select_own" on public.stripe_purchase_events;
create policy "purchase_events_select_own"
on public.stripe_purchase_events
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

create or replace function public.grant_stripe_purchase(
  p_stripe_event_id text,
  p_user_id uuid,
  p_product_id text,
  p_stripe_checkout_session_id text default null,
  p_stripe_customer_id text default null,
  p_stripe_subscription_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
  v_bonus_xp integer;
  v_is_subscription boolean := false;
  v_existing_event text;
  v_progress jsonb;
begin
  select stripe_event_id into v_existing_event
  from public.stripe_purchase_events
  where stripe_event_id = p_stripe_event_id;

  if v_existing_event is not null then
    select progress into v_progress from public.profiles where id = p_user_id;
    return coalesce(v_progress, public.cardmagic_default_progress());
  end if;

  case p_product_id
    when 'spark' then
      v_credits := 100;
      v_bonus_xp := 30;
    when 'forge' then
      v_credits := 300;
      v_bonus_xp := 110;
    when 'vault' then
      v_credits := 750;
      v_bonus_xp := 320;
    when 'monthly' then
      v_credits := 450;
      v_bonus_xp := 220;
      v_is_subscription := true;
    else
      raise exception 'Unknown CardMagic product_id: %', p_product_id;
  end case;

  insert into public.profiles (id)
  values (p_user_id)
  on conflict (id) do nothing;

  insert into public.stripe_purchase_events (
    stripe_event_id,
    user_id,
    product_id,
    stripe_checkout_session_id,
    stripe_customer_id,
    stripe_subscription_id
  )
  values (
    p_stripe_event_id,
    p_user_id,
    p_product_id,
    p_stripe_checkout_session_id,
    p_stripe_customer_id,
    p_stripe_subscription_id
  );

  update public.profiles
  set progress =
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            coalesce(progress, public.cardmagic_default_progress()),
            '{credits}',
            to_jsonb(coalesce((progress->>'credits')::integer, 0) + v_credits)
          ),
          '{lifetimeCreditsPurchased}',
          to_jsonb(coalesce((progress->>'lifetimeCreditsPurchased')::integer, 0) + v_credits)
        ),
        '{lifetimeXpEarned}',
        to_jsonb(coalesce((progress->>'lifetimeXpEarned')::integer, 0) + v_bonus_xp)
      ),
      '{subscribedMonthly}',
      to_jsonb(coalesce((progress->>'subscribedMonthly')::boolean, false) or v_is_subscription)
    )
  where id = p_user_id
  returning progress into v_progress;

  return v_progress;
end;
$$;

revoke execute on function public.grant_stripe_purchase(text, uuid, text, text, text, text) from public;
revoke execute on function public.grant_stripe_purchase(text, uuid, text, text, text, text) from anon;
revoke execute on function public.grant_stripe_purchase(text, uuid, text, text, text, text) from authenticated;
grant execute on function public.grant_stripe_purchase(text, uuid, text, text, text, text) to service_role;
