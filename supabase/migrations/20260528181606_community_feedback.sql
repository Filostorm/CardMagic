create table if not exists public.community_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feedback_type text not null,
  body text not null,
  app_version text not null,
  device_info jsonb not null default '{}'::jsonb,
  screenshot_paths text[] not null default '{}'::text[],
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_feedback_type_check check (feedback_type in ('feedback', 'bug')),
  constraint community_feedback_status_check check (status in ('open', 'reviewing', 'closed')),
  constraint community_feedback_body_length_check check (char_length(trim(body)) between 4 and 4000)
);

alter table public.community_feedback enable row level security;

create index if not exists community_feedback_user_created_idx
  on public.community_feedback (user_id, created_at desc);

create index if not exists community_feedback_status_created_idx
  on public.community_feedback (status, created_at desc);

drop policy if exists "Users can create feedback" on public.community_feedback;
create policy "Users can create feedback"
  on public.community_feedback
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own feedback" on public.community_feedback;
create policy "Users can view their own feedback"
  on public.community_feedback
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or lower(coalesce((select auth.jwt()->>'email'), '')) = 'gtjoe51@gmail.com'
  );

grant select, insert on public.community_feedback to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-feedback',
  'community-feedback',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload community feedback screenshots" on storage.objects;
create policy "Users can upload community feedback screenshots"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-feedback'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can view own community feedback screenshots" on storage.objects;
create policy "Users can view own community feedback screenshots"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'community-feedback'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or lower(coalesce((select auth.jwt()->>'email'), '')) = 'gtjoe51@gmail.com'
    )
  );
