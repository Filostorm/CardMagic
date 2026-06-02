begin;

create table if not exists public.collaboration_set_members (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.card_sets(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  invited_by uuid references auth.users(id) on delete set null,
  role text not null default 'editor',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint collaboration_set_members_target_check check (user_id is not null or invited_email is not null),
  constraint collaboration_set_members_role_check check (role in ('owner', 'editor')),
  constraint collaboration_set_members_status_check check (status in ('pending', 'accepted')),
  constraint collaboration_set_members_invited_email_normalized check (
    invited_email is null or invited_email = lower(trim(invited_email))
  )
);

create unique index if not exists collaboration_set_members_set_user_idx
on public.collaboration_set_members (set_id, user_id)
where user_id is not null;

create unique index if not exists collaboration_set_members_set_invited_email_idx
on public.collaboration_set_members (set_id, invited_email)
where invited_email is not null;

create index if not exists collaboration_set_members_user_status_idx
on public.collaboration_set_members (user_id, status, created_at desc)
where user_id is not null;

create index if not exists collaboration_set_members_email_status_idx
on public.collaboration_set_members (invited_email, status, created_at desc)
where invited_email is not null;

insert into public.collaboration_set_members (set_id, user_id, role, status, accepted_at)
select card_sets.id, card_sets.user_id, 'owner', 'accepted', coalesce(card_sets.created_at, now())
from public.card_sets
on conflict do nothing;

create table if not exists public.collaboration_set_comments (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.card_sets(id) on delete cascade,
  card_id text references public.cards(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collaboration_set_comments_body_not_empty check (length(trim(body)) > 0),
  constraint collaboration_set_comments_body_length check (char_length(body) <= 1000)
);

create index if not exists collaboration_set_comments_set_created_idx
on public.collaboration_set_comments (set_id, created_at desc);

create table if not exists public.collaboration_set_polls (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.card_sets(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  selection_type text not null default 'single',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint collaboration_set_polls_title_not_empty check (length(trim(title)) > 0),
  constraint collaboration_set_polls_title_length check (char_length(title) <= 140),
  constraint collaboration_set_polls_selection_type_check check (selection_type in ('single', 'multiple')),
  constraint collaboration_set_polls_status_check check (status in ('open', 'closed'))
);

create table if not exists public.collaboration_set_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.collaboration_set_polls(id) on delete cascade,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint collaboration_set_poll_options_label_not_empty check (length(trim(label)) > 0),
  constraint collaboration_set_poll_options_label_length check (char_length(label) <= 120)
);

create table if not exists public.collaboration_set_poll_votes (
  poll_id uuid not null references public.collaboration_set_polls(id) on delete cascade,
  option_id uuid not null references public.collaboration_set_poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (option_id, user_id)
);

create index if not exists collaboration_set_polls_set_created_idx
on public.collaboration_set_polls (set_id, created_at desc);

create index if not exists collaboration_set_poll_options_poll_position_idx
on public.collaboration_set_poll_options (poll_id, position asc);

create index if not exists collaboration_set_poll_votes_poll_user_idx
on public.collaboration_set_poll_votes (poll_id, user_id);

create table if not exists public.collaboration_set_checklist_items (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.card_sets(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  body text not null,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collaboration_set_checklist_body_not_empty check (length(trim(body)) > 0),
  constraint collaboration_set_checklist_body_length check (char_length(body) <= 220)
);

create index if not exists collaboration_set_checklist_set_created_idx
on public.collaboration_set_checklist_items (set_id, created_at desc);

alter table public.collaboration_set_members enable row level security;
alter table public.collaboration_set_comments enable row level security;
alter table public.collaboration_set_polls enable row level security;
alter table public.collaboration_set_poll_options enable row level security;
alter table public.collaboration_set_poll_votes enable row level security;
alter table public.collaboration_set_checklist_items enable row level security;

drop trigger if exists collaboration_set_comments_touch_updated_at on public.collaboration_set_comments;
create trigger collaboration_set_comments_touch_updated_at
before update on public.collaboration_set_comments
for each row
execute function public.touch_updated_at();

drop trigger if exists collaboration_set_polls_touch_updated_at on public.collaboration_set_polls;
create trigger collaboration_set_polls_touch_updated_at
before update on public.collaboration_set_polls
for each row
execute function public.touch_updated_at();

drop trigger if exists collaboration_set_checklist_touch_updated_at on public.collaboration_set_checklist_items;
create trigger collaboration_set_checklist_touch_updated_at
before update on public.collaboration_set_checklist_items
for each row
execute function public.touch_updated_at();

create or replace function public.ensure_card_set_owner_collaboration_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.collaboration_set_members (set_id, user_id, role, status, accepted_at)
  values (new.id, new.user_id, 'owner', 'accepted', now())
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists card_sets_ensure_collaboration_owner on public.card_sets;
create trigger card_sets_ensure_collaboration_owner
after insert on public.card_sets
for each row
execute function public.ensure_card_set_owner_collaboration_member();

create or replace function public.cardmagic_is_set_collaborator(p_set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.card_sets
    where card_sets.id = p_set_id
      and card_sets.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.collaboration_set_members
    where collaboration_set_members.set_id = p_set_id
      and collaboration_set_members.user_id = (select auth.uid())
      and collaboration_set_members.status = 'accepted'
  );
$$;

create or replace function public.cardmagic_can_manage_set_collaboration(p_set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.card_sets
    where card_sets.id = p_set_id
      and card_sets.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.collaboration_set_members
    where collaboration_set_members.set_id = p_set_id
      and collaboration_set_members.user_id = (select auth.uid())
      and collaboration_set_members.status = 'accepted'
      and collaboration_set_members.role = 'owner'
  );
$$;

create or replace function public.accept_collaboration_set_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Sign in to accept set collaboration invites.';
  end if;

  if length(v_email) = 0 then
    return 0;
  end if;

  update public.collaboration_set_members
  set
    user_id = v_user_id,
    status = 'accepted',
    accepted_at = coalesce(accepted_at, now())
  where invited_email = v_email
    and status = 'pending'
    and (user_id is null or user_id = v_user_id);

  get diagnostics v_count = row_count;

  delete from public.collaboration_set_members pending_member
  using public.collaboration_set_members accepted_member
  where pending_member.id <> accepted_member.id
    and pending_member.set_id = accepted_member.set_id
    and pending_member.invited_email = v_email
    and accepted_member.user_id = v_user_id
    and accepted_member.status = 'accepted'
    and pending_member.status = 'pending';

  return v_count;
end;
$$;

create or replace function public.collaboration_set_dashboard()
returns table (
  set_id uuid,
  owner_user_id uuid,
  role text,
  set_name text,
  set_code text,
  card_back_id text,
  set_symbol_preset text,
  set_symbol_uri text,
  set_symbol_uses_rarity_treatment boolean,
  owner_name text,
  member_count bigint,
  card_count bigint,
  comment_count bigint,
  poll_count bigint,
  open_checklist_count bigint,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with viewer_sets as (
    select distinct
      card_sets.id as set_id,
      card_sets.user_id as owner_user_id,
      case
        when card_sets.user_id = (select auth.uid()) then 'owner'
        else coalesce(collaboration_set_members.role, 'editor')
      end as role
    from public.card_sets
    left join public.collaboration_set_members
      on collaboration_set_members.set_id = card_sets.id
      and collaboration_set_members.user_id = (select auth.uid())
      and collaboration_set_members.status = 'accepted'
    where card_sets.user_id = (select auth.uid())
      or collaboration_set_members.user_id = (select auth.uid())
  )
  select
    card_sets.id as set_id,
    card_sets.user_id as owner_user_id,
    viewer_sets.role,
    card_sets.name as set_name,
    card_sets.set_code,
    card_sets.card_back_id,
    card_sets.set_symbol_preset,
    card_sets.set_symbol_uri,
    card_sets.set_symbol_uses_rarity_treatment,
    public.cardmagic_public_author_name(card_sets.user_id, profiles.display_name) as owner_name,
    coalesce(member_counts.member_count, 0) as member_count,
    coalesce(card_counts.card_count, 0) as card_count,
    coalesce(comment_counts.comment_count, 0) as comment_count,
    coalesce(poll_counts.poll_count, 0) as poll_count,
    coalesce(checklist_counts.open_checklist_count, 0) as open_checklist_count,
    card_sets.updated_at
  from viewer_sets
  join public.card_sets on card_sets.id = viewer_sets.set_id
  left join public.profiles on profiles.id = card_sets.user_id
  left join lateral (
    select count(*)::bigint as member_count
    from public.collaboration_set_members members
    where members.set_id = card_sets.id
      and members.status = 'accepted'
  ) member_counts on true
  left join lateral (
    select count(*)::bigint as card_count
    from public.card_set_cards set_cards
    where set_cards.set_id = card_sets.id
      and set_cards.user_id = card_sets.user_id
  ) card_counts on true
  left join lateral (
    select count(*)::bigint as comment_count
    from public.collaboration_set_comments comments
    where comments.set_id = card_sets.id
  ) comment_counts on true
  left join lateral (
    select count(*)::bigint as poll_count
    from public.collaboration_set_polls polls
    where polls.set_id = card_sets.id
  ) poll_counts on true
  left join lateral (
    select count(*)::bigint as open_checklist_count
    from public.collaboration_set_checklist_items items
    where items.set_id = card_sets.id
      and items.completed_at is null
  ) checklist_counts on true
  order by card_sets.updated_at desc, card_sets.created_at desc;
$$;

create or replace function public.invite_collaboration_set_member(p_set_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inviter_id uuid := (select auth.uid());
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_inviter_id is null then
    raise exception 'Sign in to invite collaborators.';
  end if;

  if not public.cardmagic_can_manage_set_collaboration(p_set_id) then
    raise exception 'Only the set owner can invite collaborators.';
  end if;

  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address.';
  end if;

  if v_email = lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'You are already a collaborator on this set.';
  end if;

  insert into public.collaboration_set_members (set_id, invited_email, invited_by, role, status)
  values (p_set_id, v_email, v_inviter_id, 'editor', 'pending')
  on conflict do nothing;
end;
$$;

create or replace function public.collaboration_set_cards(p_set_id uuid)
returns table (
  id text,
  user_id uuid,
  author_name text,
  author_level integer,
  name text,
  type_line text,
  rarity text,
  colors text[],
  frame_treatment text,
  image_url text,
  card jsonb,
  like_count bigint,
  comment_count bigint,
  liked_by_viewer boolean,
  followed_by_viewer boolean,
  seen_by_viewer boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cards.id,
    cards.user_id,
    public.cardmagic_public_author_name(cards.user_id, profiles.display_name) as author_name,
    public.cardmagic_level_from_progress(coalesce(profiles.progress, public.cardmagic_default_progress())) as author_level,
    cards.name,
    cards.type_line,
    cards.rarity,
    cards.colors,
    cards.frame_treatment,
    cards.image_url,
    cards.card,
    cards.like_count::bigint,
    cards.comment_count::bigint,
    (viewer_likes.user_id is not null) as liked_by_viewer,
    (viewer_follows.follower_user_id is not null) as followed_by_viewer,
    (viewer_views.user_id is not null) as seen_by_viewer,
    cards.created_at,
    cards.updated_at
  from public.card_sets
  join public.card_set_cards
    on card_set_cards.user_id = card_sets.user_id
    and card_set_cards.set_id = card_sets.id
  join public.cards on cards.id = card_set_cards.card_id
  left join public.profiles on profiles.id = cards.user_id
  left join public.community_card_likes viewer_likes
    on viewer_likes.card_id = cards.id
    and viewer_likes.user_id = (select auth.uid())
  left join public.community_user_follows viewer_follows
    on viewer_follows.followed_user_id = cards.user_id
    and viewer_follows.follower_user_id = (select auth.uid())
  left join public.community_card_views viewer_views
    on viewer_views.card_id = cards.id
    and viewer_views.user_id = (select auth.uid())
  where card_sets.id = p_set_id
    and public.cardmagic_is_set_collaborator(p_set_id)
  order by card_set_cards.position asc, cards.created_at asc;
$$;

create or replace function public.add_collaboration_set_card(
  p_set_id uuid,
  p_local_snapshot_id text,
  p_card jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_owner_user_id uuid;
  v_card_id text;
  v_local_snapshot_id text;
  v_position integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to add cards to collaborative sets.';
  end if;

  if not public.cardmagic_is_set_collaborator(p_set_id) then
    raise exception 'You are not a collaborator on this set.';
  end if;

  if p_card is null or jsonb_typeof(p_card) <> 'object' then
    raise exception 'Card payload must be an object.';
  end if;

  select user_id into v_owner_user_id
  from public.card_sets
  where id = p_set_id;

  if v_owner_user_id is null then
    raise exception 'Set not found.';
  end if;

  v_local_snapshot_id := 'collab:' || p_set_id::text || ':' || left(regexp_replace(coalesce(p_local_snapshot_id, gen_random_uuid()::text), '[^a-zA-Z0-9._:-]+', '-', 'g'), 120);
  v_card_id := v_user_id::text || ':' || v_local_snapshot_id;

  insert into public.cards (
    id,
    user_id,
    local_snapshot_id,
    name,
    type_line,
    rarity,
    colors,
    frame_treatment,
    image_url,
    card,
    visibility
  )
  values (
    v_card_id,
    v_user_id,
    v_local_snapshot_id,
    coalesce(p_card->>'name', ''),
    coalesce(p_card->>'typeLine', ''),
    p_card->>'rarity',
    coalesce(
      array(
        select jsonb_array_elements_text(
          case when jsonb_typeof(p_card->'frameColors') = 'array' then p_card->'frameColors' else '[]'::jsonb end
        )
      ),
      '{}'::text[]
    ),
    p_card->>'frameTreatment',
    null,
    p_card,
    'unlisted'
  )
  on conflict (id) do update set
    name = excluded.name,
    type_line = excluded.type_line,
    rarity = excluded.rarity,
    colors = excluded.colors,
    frame_treatment = excluded.frame_treatment,
    image_url = excluded.image_url,
    card = excluded.card,
    visibility = excluded.visibility,
    updated_at = now();

  select coalesce(max(position), -1) + 1 into v_position
  from public.card_set_cards
  where user_id = v_owner_user_id
    and set_id = p_set_id;

  insert into public.card_set_cards (user_id, set_id, card_id, position)
  values (v_owner_user_id, p_set_id, v_card_id, v_position)
  on conflict (user_id, set_id, card_id) do update set
    updated_at = now();

  update public.card_sets
  set updated_at = now()
  where id = p_set_id;

  return v_card_id;
end;
$$;

create or replace function public.collaboration_set_comments(p_set_id uuid)
returns table (
  id uuid,
  set_id uuid,
  card_id text,
  user_id uuid,
  author_name text,
  body text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    comments.id,
    comments.set_id,
    comments.card_id,
    comments.user_id,
    public.cardmagic_public_author_name(comments.user_id, profiles.display_name) as author_name,
    comments.body,
    comments.created_at,
    comments.updated_at
  from public.collaboration_set_comments comments
  left join public.profiles on profiles.id = comments.user_id
  where comments.set_id = p_set_id
    and public.cardmagic_is_set_collaborator(p_set_id)
  order by comments.created_at desc;
$$;

create or replace function public.add_collaboration_set_comment(p_set_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_comment_id uuid;
  v_body text := left(trim(coalesce(p_body, '')), 1000);
begin
  if v_user_id is null then
    raise exception 'Sign in to comment on collaborative sets.';
  end if;

  if not public.cardmagic_is_set_collaborator(p_set_id) then
    raise exception 'You are not a collaborator on this set.';
  end if;

  if length(v_body) = 0 then
    raise exception 'Comment cannot be empty.';
  end if;

  insert into public.collaboration_set_comments (set_id, user_id, body)
  values (p_set_id, v_user_id, v_body)
  returning id into v_comment_id;

  update public.card_sets
  set updated_at = now()
  where id = p_set_id;

  return v_comment_id;
end;
$$;

create or replace function public.collaboration_set_poll_list(p_set_id uuid)
returns table (
  poll_id uuid,
  title text,
  selection_type text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  closed_at timestamptz,
  option_id uuid,
  option_label text,
  option_position integer,
  vote_count bigint,
  selected_by_viewer boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    polls.id as poll_id,
    polls.title,
    polls.selection_type,
    polls.status,
    polls.created_at,
    polls.updated_at,
    polls.closed_at,
    options.id as option_id,
    options.label as option_label,
    options.position as option_position,
    coalesce(vote_counts.vote_count, 0) as vote_count,
    exists (
      select 1
      from public.collaboration_set_poll_votes viewer_votes
      where viewer_votes.poll_id = polls.id
        and viewer_votes.option_id = options.id
        and viewer_votes.user_id = (select auth.uid())
    ) as selected_by_viewer
  from public.collaboration_set_polls polls
  join public.collaboration_set_poll_options options on options.poll_id = polls.id
  left join lateral (
    select count(*)::bigint as vote_count
    from public.collaboration_set_poll_votes votes
    where votes.option_id = options.id
  ) vote_counts on true
  where polls.set_id = p_set_id
    and public.cardmagic_is_set_collaborator(p_set_id)
  order by
    case when polls.status = 'open' then 0 else 1 end,
    polls.created_at desc,
    options.position asc;
$$;

create or replace function public.create_collaboration_set_poll(
  p_set_id uuid,
  p_title text,
  p_selection_type text,
  p_options text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_poll_id uuid;
  v_title text := left(trim(coalesce(p_title, '')), 140);
  v_selection_type text := case when p_selection_type = 'multiple' then 'multiple' else 'single' end;
  v_options text[] := array(
    select option_label
    from (
      select distinct on (lower(left(trim(option_label), 120)))
        left(trim(option_label), 120) as option_label,
        option_ordinality
      from unnest(coalesce(p_options, array[]::text[])) with ordinality as option_input(option_label, option_ordinality)
      where length(trim(option_label)) > 0
      order by lower(left(trim(option_label), 120)), option_ordinality
    ) deduped_options
    order by option_ordinality
  );
  v_option text;
  v_position integer := 0;
begin
  if v_user_id is null then
    raise exception 'Sign in to create set polls.';
  end if;

  if not public.cardmagic_is_set_collaborator(p_set_id) then
    raise exception 'You are not a collaborator on this set.';
  end if;

  if length(v_title) = 0 then
    raise exception 'Poll title is required.';
  end if;

  if coalesce(array_length(v_options, 1), 0) < 2 then
    raise exception 'Polls need at least two options.';
  end if;

  insert into public.collaboration_set_polls (set_id, created_by, title, selection_type)
  values (p_set_id, v_user_id, v_title, v_selection_type)
  returning id into v_poll_id;

  foreach v_option in array v_options loop
    insert into public.collaboration_set_poll_options (poll_id, label, position)
    values (v_poll_id, v_option, v_position);
    v_position := v_position + 1;
  end loop;

  update public.card_sets
  set updated_at = now()
  where id = p_set_id;

  return v_poll_id;
end;
$$;

create or replace function public.submit_collaboration_set_poll_vote(p_poll_id uuid, p_option_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_set_id uuid;
  v_selection_type text;
  v_option_ids uuid[] := array(
    select distinct option_id
    from unnest(coalesce(p_option_ids, array[]::uuid[])) as option_id
  );
  v_valid_count integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to vote on set polls.';
  end if;

  select set_id, selection_type into v_set_id, v_selection_type
  from public.collaboration_set_polls
  where id = p_poll_id
    and status = 'open';

  if v_set_id is null or not public.cardmagic_is_set_collaborator(v_set_id) then
    raise exception 'This poll is closed or unavailable.';
  end if;

  if coalesce(array_length(v_option_ids, 1), 0) = 0 then
    raise exception 'Choose at least one option.';
  end if;

  if v_selection_type = 'single' and array_length(v_option_ids, 1) <> 1 then
    raise exception 'Choose one option for this poll.';
  end if;

  select count(*)::integer into v_valid_count
  from public.collaboration_set_poll_options
  where poll_id = p_poll_id
    and id = any(v_option_ids);

  if v_valid_count <> array_length(v_option_ids, 1) then
    raise exception 'One or more poll options are invalid.';
  end if;

  delete from public.collaboration_set_poll_votes
  where poll_id = p_poll_id
    and user_id = v_user_id;

  insert into public.collaboration_set_poll_votes (poll_id, option_id, user_id)
  select p_poll_id, option_id, v_user_id
  from unnest(v_option_ids) as option_id;
end;
$$;

create or replace function public.collaboration_set_checklist(p_set_id uuid)
returns table (
  id uuid,
  set_id uuid,
  user_id uuid,
  author_name text,
  body text,
  completed boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    items.id,
    items.set_id,
    items.created_by as user_id,
    public.cardmagic_public_author_name(items.created_by, profiles.display_name) as author_name,
    items.body,
    (items.completed_at is not null) as completed,
    items.created_at,
    items.updated_at
  from public.collaboration_set_checklist_items items
  left join public.profiles on profiles.id = items.created_by
  where items.set_id = p_set_id
    and public.cardmagic_is_set_collaborator(p_set_id)
  order by
    case when items.completed_at is null then 0 else 1 end,
    items.created_at desc;
$$;

create or replace function public.add_collaboration_set_checklist_item(p_set_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_item_id uuid;
  v_body text := left(trim(coalesce(p_body, '')), 220);
begin
  if v_user_id is null then
    raise exception 'Sign in to add checklist items.';
  end if;

  if not public.cardmagic_is_set_collaborator(p_set_id) then
    raise exception 'You are not a collaborator on this set.';
  end if;

  if length(v_body) = 0 then
    raise exception 'Checklist item cannot be empty.';
  end if;

  insert into public.collaboration_set_checklist_items (set_id, created_by, body)
  values (p_set_id, v_user_id, v_body)
  returning id into v_item_id;

  update public.card_sets
  set updated_at = now()
  where id = p_set_id;

  return v_item_id;
end;
$$;

create or replace function public.set_collaboration_set_checklist_item_completed(p_item_id uuid, p_completed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_set_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to update checklist items.';
  end if;

  select set_id into v_set_id
  from public.collaboration_set_checklist_items
  where id = p_item_id;

  if v_set_id is null or not public.cardmagic_is_set_collaborator(v_set_id) then
    raise exception 'Checklist item is unavailable.';
  end if;

  update public.collaboration_set_checklist_items
  set
    completed_at = case when p_completed then now() else null end,
    completed_by = case when p_completed then v_user_id else null end
  where id = p_item_id;

  update public.card_sets
  set updated_at = now()
  where id = v_set_id;
end;
$$;

drop policy if exists "collaboration_set_members_select_related" on public.collaboration_set_members;
create policy "collaboration_set_members_select_related"
on public.collaboration_set_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or invited_email = lower(coalesce(auth.jwt() ->> 'email', ''))
  or public.cardmagic_can_manage_set_collaboration(set_id)
);

drop policy if exists "collaboration_set_comments_select_members" on public.collaboration_set_comments;
create policy "collaboration_set_comments_select_members"
on public.collaboration_set_comments
for select
to authenticated
using (public.cardmagic_is_set_collaborator(set_id));

drop policy if exists "collaboration_set_polls_select_members" on public.collaboration_set_polls;
create policy "collaboration_set_polls_select_members"
on public.collaboration_set_polls
for select
to authenticated
using (public.cardmagic_is_set_collaborator(set_id));

drop policy if exists "collaboration_set_poll_options_select_members" on public.collaboration_set_poll_options;
create policy "collaboration_set_poll_options_select_members"
on public.collaboration_set_poll_options
for select
to authenticated
using (
  exists (
    select 1
    from public.collaboration_set_polls polls
    where polls.id = collaboration_set_poll_options.poll_id
      and public.cardmagic_is_set_collaborator(polls.set_id)
  )
);

drop policy if exists "collaboration_set_poll_votes_select_own" on public.collaboration_set_poll_votes;
create policy "collaboration_set_poll_votes_select_own"
on public.collaboration_set_poll_votes
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "collaboration_set_checklist_select_members" on public.collaboration_set_checklist_items;
create policy "collaboration_set_checklist_select_members"
on public.collaboration_set_checklist_items
for select
to authenticated
using (public.cardmagic_is_set_collaborator(set_id));

revoke execute on function public.ensure_card_set_owner_collaboration_member() from public;
revoke execute on function public.cardmagic_is_set_collaborator(uuid) from public;
revoke execute on function public.cardmagic_can_manage_set_collaboration(uuid) from public;
revoke execute on function public.accept_collaboration_set_invites() from public;
revoke execute on function public.collaboration_set_dashboard() from public;
revoke execute on function public.invite_collaboration_set_member(uuid, text) from public;
revoke execute on function public.collaboration_set_cards(uuid) from public;
revoke execute on function public.add_collaboration_set_card(uuid, text, jsonb) from public;
revoke execute on function public.collaboration_set_comments(uuid) from public;
revoke execute on function public.add_collaboration_set_comment(uuid, text) from public;
revoke execute on function public.collaboration_set_poll_list(uuid) from public;
revoke execute on function public.create_collaboration_set_poll(uuid, text, text, text[]) from public;
revoke execute on function public.submit_collaboration_set_poll_vote(uuid, uuid[]) from public;
revoke execute on function public.collaboration_set_checklist(uuid) from public;
revoke execute on function public.add_collaboration_set_checklist_item(uuid, text) from public;
revoke execute on function public.set_collaboration_set_checklist_item_completed(uuid, boolean) from public;

revoke execute on function public.ensure_card_set_owner_collaboration_member() from anon, authenticated;
revoke execute on function public.cardmagic_is_set_collaborator(uuid) from anon;
revoke execute on function public.cardmagic_can_manage_set_collaboration(uuid) from anon;
revoke execute on function public.accept_collaboration_set_invites() from anon;
revoke execute on function public.collaboration_set_dashboard() from anon;
revoke execute on function public.invite_collaboration_set_member(uuid, text) from anon;
revoke execute on function public.collaboration_set_cards(uuid) from anon;
revoke execute on function public.add_collaboration_set_card(uuid, text, jsonb) from anon;
revoke execute on function public.collaboration_set_comments(uuid) from anon;
revoke execute on function public.add_collaboration_set_comment(uuid, text) from anon;
revoke execute on function public.collaboration_set_poll_list(uuid) from anon;
revoke execute on function public.create_collaboration_set_poll(uuid, text, text, text[]) from anon;
revoke execute on function public.submit_collaboration_set_poll_vote(uuid, uuid[]) from anon;
revoke execute on function public.collaboration_set_checklist(uuid) from anon;
revoke execute on function public.add_collaboration_set_checklist_item(uuid, text) from anon;
revoke execute on function public.set_collaboration_set_checklist_item_completed(uuid, boolean) from anon;

grant execute on function public.cardmagic_is_set_collaborator(uuid) to authenticated;
grant execute on function public.cardmagic_can_manage_set_collaboration(uuid) to authenticated;
grant execute on function public.accept_collaboration_set_invites() to authenticated;
grant execute on function public.collaboration_set_dashboard() to authenticated;
grant execute on function public.invite_collaboration_set_member(uuid, text) to authenticated;
grant execute on function public.collaboration_set_cards(uuid) to authenticated;
grant execute on function public.add_collaboration_set_card(uuid, text, jsonb) to authenticated;
grant execute on function public.collaboration_set_comments(uuid) to authenticated;
grant execute on function public.add_collaboration_set_comment(uuid, text) to authenticated;
grant execute on function public.collaboration_set_poll_list(uuid) to authenticated;
grant execute on function public.create_collaboration_set_poll(uuid, text, text, text[]) to authenticated;
grant execute on function public.submit_collaboration_set_poll_vote(uuid, uuid[]) to authenticated;
grant execute on function public.collaboration_set_checklist(uuid) to authenticated;
grant execute on function public.add_collaboration_set_checklist_item(uuid, text) to authenticated;
grant execute on function public.set_collaboration_set_checklist_item_completed(uuid, boolean) to authenticated;

grant select on public.collaboration_set_members to authenticated;
grant select on public.collaboration_set_comments to authenticated;
grant select on public.collaboration_set_polls to authenticated;
grant select on public.collaboration_set_poll_options to authenticated;
grant select on public.collaboration_set_poll_votes to authenticated;
grant select on public.collaboration_set_checklist_items to authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
