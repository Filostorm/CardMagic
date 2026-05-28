create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  balance_after integer,
  type text not null,
  source text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint credit_transactions_amount_not_zero check (amount <> 0),
  constraint credit_transactions_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint credit_transactions_type_check check (
    type in (
      'purchase',
      'spend',
      'promo_code',
      'level_reward',
      'admin_grant',
      'refund',
      'migration'
    )
  )
);

create index if not exists credit_transactions_user_created_at_idx
on public.credit_transactions (user_id, created_at desc);

create unique index if not exists credit_transactions_user_reference_unique_idx
on public.credit_transactions (user_id, type, reference_id)
where reference_id is not null;

alter table public.credit_transactions enable row level security;

drop policy if exists "credit_transactions_select_own" on public.credit_transactions;
create policy "credit_transactions_select_own"
on public.credit_transactions
for select
to authenticated
using ((select auth.uid()) = user_id);

grant select on public.credit_transactions to authenticated;

create or replace function public.record_credit_transaction(
  p_amount integer,
  p_type text,
  p_source text default null,
  p_reference_id text default null,
  p_balance_after integer default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_amount = 0 then
    raise exception 'Credit transaction amount cannot be zero.';
  end if;

  if p_type not in ('spend', 'promo_code', 'level_reward') then
    raise exception 'Client credit transaction type is not allowed: %', p_type;
  end if;

  insert into public.credit_transactions (
    user_id,
    amount,
    balance_after,
    type,
    source,
    reference_id,
    metadata
  )
  values (
    v_user_id,
    p_amount,
    p_balance_after,
    p_type,
    p_source,
    p_reference_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id, type, reference_id)
  where reference_id is not null
  do update set
    amount = excluded.amount,
    balance_after = excluded.balance_after,
    source = excluded.source,
    metadata = excluded.metadata
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

revoke execute on function public.record_credit_transaction(integer, text, text, text, integer, jsonb) from public;
revoke execute on function public.record_credit_transaction(integer, text, text, text, integer, jsonb) from anon;
grant execute on function public.record_credit_transaction(integer, text, text, text, integer, jsonb) to authenticated;

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

  insert into public.credit_transactions (
    user_id,
    amount,
    balance_after,
    type,
    source,
    reference_id,
    metadata
  )
  values (
    p_user_id,
    v_credits,
    coalesce((v_progress->>'credits')::integer, null),
    'purchase',
    p_product_id,
    p_stripe_event_id,
    jsonb_build_object(
      'stripe_checkout_session_id', p_stripe_checkout_session_id,
      'stripe_customer_id', p_stripe_customer_id,
      'stripe_subscription_id', p_stripe_subscription_id,
      'bonus_xp', v_bonus_xp
    )
  )
  on conflict (user_id, type, reference_id)
  where reference_id is not null
  do nothing;

  return v_progress;
end;
$$;

revoke execute on function public.grant_stripe_purchase(text, uuid, text, text, text, text) from public;
revoke execute on function public.grant_stripe_purchase(text, uuid, text, text, text, text) from anon;
revoke execute on function public.grant_stripe_purchase(text, uuid, text, text, text, text) from authenticated;
grant execute on function public.grant_stripe_purchase(text, uuid, text, text, text, text) to service_role;

insert into public.credit_transactions (
  user_id,
  amount,
  balance_after,
  type,
  source,
  reference_id,
  metadata
)
select
  profiles.id,
  coalesce((profiles.progress->>'credits')::integer, 0),
  coalesce((profiles.progress->>'credits')::integer, 0),
  'migration',
  'profile_backfill',
  'profile-backfill-' || profiles.id::text,
  jsonb_build_object('reason', 'Backfilled from profiles.progress credits')
from public.profiles
where coalesce((profiles.progress->>'credits')::integer, 0) <> 0
on conflict (user_id, type, reference_id)
where reference_id is not null
do nothing;
