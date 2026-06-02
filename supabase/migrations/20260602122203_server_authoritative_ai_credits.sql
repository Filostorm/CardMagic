create or replace function public.cardmagic_ai_credit_cost(p_category text)
returns integer
language sql
immutable
as $$
  select case p_category
    when 'artImage' then 10
    when 'artImageHigh' then 12
    when 'subjectMask' then 4
    when 'setIcon' then 4
    when 'rulesText' then 0
    else null
  end;
$$;

revoke execute on function public.cardmagic_ai_credit_cost(text) from public;
revoke execute on function public.cardmagic_ai_credit_cost(text) from anon;
revoke execute on function public.cardmagic_ai_credit_cost(text) from authenticated;

create or replace function public.spend_ai_credits(
  p_category text,
  p_source text default null,
  p_reference_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_category text := nullif(trim(coalesce(p_category, '')), '');
  v_cost integer;
  v_source text := nullif(left(trim(coalesce(p_source, p_category, 'ai')), 120), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_progress jsonb;
  v_credits integer;
  v_lifetime_xp integer;
  v_lifetime_credits_purchased integer;
  v_lifetime_level_credits_earned integer;
  v_highest_rewarded_level integer;
  v_level integer;
  v_level_reward integer;
  v_balance_after integer;
  v_spend_transaction_id uuid := gen_random_uuid();
  v_reference_id text := nullif(trim(coalesce(p_reference_id, '')), '');
  v_existing_spend public.credit_transactions%rowtype;
  v_existing_category text;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  v_cost := public.cardmagic_ai_credit_cost(v_category);

  if v_cost is null then
    raise exception 'Unsupported AI credit category: %', coalesce(v_category, '(empty)');
  end if;

  if jsonb_typeof(v_metadata) <> 'object' then
    raise exception 'Credit spend metadata must be a JSON object.';
  end if;

  insert into public.profiles (id)
  values (v_user_id)
  on conflict (id) do nothing;

  select coalesce(progress, public.cardmagic_default_progress())
  into v_progress
  from public.profiles
  where id = v_user_id
  for update;

  if v_reference_id is not null then
    select *
    into v_existing_spend
    from public.credit_transactions
    where user_id = v_user_id
      and type = 'spend'
      and reference_id = v_reference_id
    limit 1;

    if found then
      v_existing_category := coalesce(v_existing_spend.metadata->>'category', v_category);

      return jsonb_build_object(
        'transactionId', v_existing_spend.id,
        'category', v_existing_category,
        'cost', greatest(0, abs(v_existing_spend.amount)),
        'balanceAfter', v_existing_spend.balance_after,
        'levelReward', 0,
        'progress', v_progress,
        'idempotent', true
      );
    end if;
  end if;

  if v_cost = 0 then
    return jsonb_build_object(
      'transactionId', null,
      'category', v_category,
      'cost', 0,
      'balanceAfter', coalesce((v_progress->>'credits')::integer, 0),
      'levelReward', 0,
      'progress', v_progress
    );
  end if;

  v_credits := greatest(0, coalesce((v_progress->>'credits')::integer, 0));

  if v_credits < v_cost then
    raise exception 'Not enough credits for %: need %, have %.', v_category, v_cost, v_credits;
  end if;

  v_lifetime_xp := greatest(0, coalesce((v_progress->>'lifetimeXpEarned')::integer, 0)) + (v_cost * 2);
  v_lifetime_credits_purchased := greatest(0, coalesce((v_progress->>'lifetimeCreditsPurchased')::integer, 0));
  v_lifetime_level_credits_earned := greatest(0, coalesce((v_progress->>'lifetimeLevelCreditsEarned')::integer, 0));
  v_highest_rewarded_level := greatest(1, coalesce((v_progress->>'highestRewardedLevel')::integer, 1));

  v_progress := jsonb_set(v_progress, '{schemaVersion}', to_jsonb(1), true);
  v_progress := jsonb_set(v_progress, '{lifetimeXpEarned}', to_jsonb(v_lifetime_xp), true);
  v_level := public.cardmagic_level_from_progress(v_progress);
  v_level_reward := greatest(0, v_level - v_highest_rewarded_level) * 10;
  v_balance_after := v_credits - v_cost + v_level_reward;

  v_progress := jsonb_set(v_progress, '{credits}', to_jsonb(v_balance_after), true);
  v_progress := jsonb_set(
    v_progress,
    '{lifetimeCreditsPurchased}',
    to_jsonb(v_lifetime_credits_purchased + v_level_reward),
    true
  );
  v_progress := jsonb_set(
    v_progress,
    '{lifetimeLevelCreditsEarned}',
    to_jsonb(v_lifetime_level_credits_earned + v_level_reward),
    true
  );
  v_progress := jsonb_set(
    v_progress,
    '{highestRewardedLevel}',
    to_jsonb(greatest(v_highest_rewarded_level, v_level)),
    true
  );

  update public.profiles
  set progress = v_progress
  where id = v_user_id
  returning progress into v_progress;

  v_reference_id := coalesce(v_reference_id, 'ai-spend-' || v_spend_transaction_id::text);

  insert into public.credit_transactions (
    id,
    user_id,
    amount,
    balance_after,
    type,
    source,
    reference_id,
    metadata
  )
  values (
    v_spend_transaction_id,
    v_user_id,
    -v_cost,
    v_balance_after,
    'spend',
    coalesce(v_source, v_category),
    v_reference_id,
    v_metadata || jsonb_build_object('category', v_category, 'cost', v_cost)
  );

  if v_level_reward > 0 then
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
      v_level_reward,
      v_balance_after,
      'level_reward',
      'ai-spend-level-reward',
      v_reference_id || ':level',
      jsonb_build_object(
        'spend_transaction_id', v_spend_transaction_id,
        'category', v_category
      )
    )
    on conflict (user_id, type, reference_id)
    where reference_id is not null
    do nothing;
  end if;

  return jsonb_build_object(
    'transactionId', v_spend_transaction_id,
    'category', v_category,
    'cost', v_cost,
    'balanceAfter', v_balance_after,
    'levelReward', v_level_reward,
    'progress', v_progress
  );
end;
$$;

revoke execute on function public.spend_ai_credits(text, text, text, jsonb) from public;
revoke execute on function public.spend_ai_credits(text, text, text, jsonb) from anon;
grant execute on function public.spend_ai_credits(text, text, text, jsonb) to authenticated;

create or replace function public.refund_ai_credit_spend(
  p_user_id uuid,
  p_spend_transaction_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spend public.credit_transactions%rowtype;
  v_existing_refund_id uuid;
  v_refund_reference_id text;
  v_progress jsonb;
  v_credit_refund integer;
  v_balance_after integer;
  v_reason text := left(coalesce(nullif(trim(p_reason), ''), 'provider_failure'), 240);
begin
  if p_user_id is null then
    raise exception 'User id is required.';
  end if;

  if p_spend_transaction_id is null then
    raise exception 'Spend transaction id is required.';
  end if;

  select *
  into v_spend
  from public.credit_transactions
  where id = p_spend_transaction_id
    and user_id = p_user_id
    and type = 'spend'
  for update;

  if v_spend.id is null then
    raise exception 'Spend transaction was not found.';
  end if;

  v_refund_reference_id := 'ai-refund-' || p_spend_transaction_id::text;

  select id
  into v_existing_refund_id
  from public.credit_transactions
  where user_id = p_user_id
    and type = 'refund'
    and reference_id = v_refund_reference_id;

  select coalesce(progress, public.cardmagic_default_progress())
  into v_progress
  from public.profiles
  where id = p_user_id
  for update;

  if v_existing_refund_id is not null then
    return jsonb_build_object(
      'transactionId', v_existing_refund_id,
      'refundedSpendTransactionId', p_spend_transaction_id,
      'alreadyRefunded', true,
      'progress', v_progress
    );
  end if;

  v_credit_refund := greatest(0, abs(v_spend.amount));

  if v_credit_refund <= 0 then
    raise exception 'Spend transaction has no refundable credit amount.';
  end if;

  v_balance_after := greatest(0, coalesce((v_progress->>'credits')::integer, 0)) + v_credit_refund;
  v_progress := jsonb_set(v_progress, '{credits}', to_jsonb(v_balance_after), true);

  update public.profiles
  set progress = v_progress
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
    v_credit_refund,
    v_balance_after,
    'refund',
    coalesce(v_spend.source, 'ai-spend-refund'),
    v_refund_reference_id,
    jsonb_build_object(
      'reason', v_reason,
      'refunded_spend_transaction_id', p_spend_transaction_id,
      'category', v_spend.metadata->>'category'
    )
  )
  returning id into v_existing_refund_id;

  return jsonb_build_object(
    'transactionId', v_existing_refund_id,
    'refundedSpendTransactionId', p_spend_transaction_id,
    'alreadyRefunded', false,
    'amount', v_credit_refund,
    'balanceAfter', v_balance_after,
    'progress', v_progress
  );
end;
$$;

revoke execute on function public.refund_ai_credit_spend(uuid, uuid, text) from public;
revoke execute on function public.refund_ai_credit_spend(uuid, uuid, text) from anon;
revoke execute on function public.refund_ai_credit_spend(uuid, uuid, text) from authenticated;
grant execute on function public.refund_ai_credit_spend(uuid, uuid, text) to service_role;
