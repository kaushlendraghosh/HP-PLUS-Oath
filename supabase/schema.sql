-- Run this in Supabase Dashboard > SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  updated_at timestamptz not null default now(),
  constraint profiles_allowed_domain check (lower(email) ~ '^[^@]+@hbplus\.fit$')
);

alter table public.profiles enable row level security;

-- A signed-in user may only read their own profile, and only with the approved email domain.
create policy "Read own approved profile"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  and lower(coalesce(auth.jwt() ->> 'email', '')) ~ '^[^@]+@hbplus\.fit$'
);

create policy "Insert own approved profile"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and lower(email) ~ '^[^@]+@hbplus\.fit$'
);

create policy "Update own approved profile"
on public.profiles for update
to authenticated
using (
  id = auth.uid()
  and lower(coalesce(auth.jwt() ->> 'email', '')) ~ '^[^@]+@hbplus\.fit$'
)
with check (
  id = auth.uid()
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and lower(email) ~ '^[^@]+@hbplus\.fit$'
);
