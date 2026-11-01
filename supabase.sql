-- Paste this whole file into Supabase > SQL Editor > New query, then click Run.

create table if not exists public.clients (
  username text primary key,
  salt text not null,
  hash text not null,
  disabled boolean not null default false,
  created timestamptz not null default now()
);

create table if not exists public.login_attempts (
  key text primary key,
  count integer not null,
  first_at bigint not null
);

-- Lock both tables: nobody can read them from a browser. Only the server (with the secret key) can.
alter table public.clients enable row level security;
alter table public.login_attempts enable row level security;

grant select, insert, update, delete on public.clients to service_role;
grant select, insert, update, delete on public.login_attempts to service_role;
