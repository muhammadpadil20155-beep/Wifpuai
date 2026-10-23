-- Jalankan di Supabase: SQL Editor > New query > Run
create table if not exists public.users (
  id text primary key,
  name text not null,
  email text unique not null,
  salt text not null,
  pw text not null,
  created_at timestamptz default now()
);
alter table public.users enable row level security;  -- tanpa policy: hanya service_role (server) yang bisa akses
