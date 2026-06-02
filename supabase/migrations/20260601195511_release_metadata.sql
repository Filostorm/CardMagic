create table if not exists public.cardmagic_release_deployments (
  branch text primary key,
  version text not null,
  branch_url text not null,
  deployment_url text,
  deployed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cardmagic_release_deployments_branch_check check (branch in ('beta', 'main')),
  constraint cardmagic_release_deployments_version_check check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  constraint cardmagic_release_deployments_branch_url_check check (branch_url ~ '^https://'),
  constraint cardmagic_release_deployments_deployment_url_check check (
    deployment_url is null
    or deployment_url ~ '^https://'
  )
);

alter table public.cardmagic_release_deployments enable row level security;

drop policy if exists "Public can read CardMagic release deployments" on public.cardmagic_release_deployments;
create policy "Public can read CardMagic release deployments"
  on public.cardmagic_release_deployments
  for select
  to anon, authenticated
  using (true);

grant select on public.cardmagic_release_deployments to anon, authenticated;

insert into public.cardmagic_release_deployments (
  branch,
  version,
  branch_url,
  deployment_url,
  deployed_at,
  updated_at
)
values
  (
    'beta',
    '3.30.49',
    'https://beta.cardmagic-5dy.pages.dev/?v=3.30.49',
    'https://beta.cardmagic-5dy.pages.dev',
    now(),
    now()
  ),
  (
    'main',
    '3.30.50',
    'https://cardmagic.craftsmannsoftware.com/?v=3.30.50',
    'https://cardmagic.craftsmannsoftware.com',
    now(),
    now()
  )
on conflict (branch) do update set
  version = excluded.version,
  branch_url = excluded.branch_url,
  deployment_url = excluded.deployment_url,
  deployed_at = excluded.deployed_at,
  updated_at = now();
