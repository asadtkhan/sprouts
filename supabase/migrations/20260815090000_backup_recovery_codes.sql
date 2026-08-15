-- Cloud backup for personal Sprout data, recoverable by code.
--
-- Why not just key everything off auth.uid()? Because the anonymous
-- Supabase session lives in localStorage, same as the app's own data.
-- A wiped device (e.g. an iOS home screen icon removed and re-added)
-- loses both together. So identity here is a separate, stable `owner_id`
-- that any future anonymous session can re-attach to, as long as the
-- person has their recovery code. Nothing below is reachable directly
-- by the client except through the functions at the bottom, which run
-- as SECURITY DEFINER and enforce their own rules regardless of RLS.

create extension if not exists pgcrypto;

create table public.owners (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Which auth sessions are currently allowed to read/write which owner.
-- One auth session links to exactly one owner; one owner can have many
-- linked sessions (e.g. after a restore, both the old and new session
-- remain valid until storage is wiped again).
create table public.identity_links (
  auth_uid uuid primary key references auth.users(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  linked_at timestamptz not null default now()
);
create index identity_links_owner_id_idx on public.identity_links(owner_id);

-- Only a hash of the code is ever stored. One active code per owner;
-- regenerating replaces it rather than adding a second valid code.
create table public.recovery_codes (
  owner_id uuid primary key references public.owners(id) on delete cascade,
  code_hash text not null unique,
  created_at timestamptz not null default now()
);

create table public.user_state (
  owner_id uuid primary key references public.owners(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.owners enable row level security;
alter table public.identity_links enable row level security;
alter table public.recovery_codes enable row level security;
alter table public.user_state enable row level security;

-- No policies on owners, identity_links or recovery_codes at all, and no
-- grants to anon/authenticated either — the client never touches these
-- tables directly, only through the functions below.
revoke all on public.owners from anon, authenticated;
revoke all on public.identity_links from anon, authenticated;
revoke all on public.recovery_codes from anon, authenticated;

create policy "Read your own state"
  on public.user_state for select
  to anon, authenticated
  using (owner_id in (select owner_id from public.identity_links where auth_uid = auth.uid()));

create policy "Write your own state"
  on public.user_state for update
  to anon, authenticated
  using (owner_id in (select owner_id from public.identity_links where auth_uid = auth.uid()));

-- No insert policy on purpose: rows are only ever created by
-- bootstrap_owner() below, never directly by a client.
grant select, update on public.user_state to anon, authenticated;

-- Generates one recovery code. 16 chars over a 32-symbol alphabet is
-- around 10^24 possibilities, so it doesn't need rate limiting to resist
-- guessing, unlike a human-chosen password.
create or replace function public.generate_backup_code()
returns text
language plpgsql
as $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
begin
  for i in 1..16 loop
    v_code := v_code || substr(v_alphabet, floor(random() * length(v_alphabet) + 1)::int, 1);
    if i % 4 = 0 and i < 16 then
      v_code := v_code || '-';
    end if;
  end loop;
  return v_code;
end;
$$;

-- Creates a brand new owner for the calling (anonymous) session and
-- returns a one-time recovery code. Safe to call again if this exact
-- session somehow already has a backup — it just returns the existing
-- owner without generating a second one.
create or replace function public.bootstrap_owner()
returns table (owner_id uuid, recovery_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_code text;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select il.owner_id into v_owner_id from public.identity_links il where il.auth_uid = v_uid;
  if v_owner_id is not null then
    return query select v_owner_id, null::text;
    return;
  end if;

  insert into public.owners default values returning id into v_owner_id;
  insert into public.identity_links (auth_uid, owner_id) values (v_uid, v_owner_id);
  insert into public.user_state (owner_id, state) values (v_owner_id, '{}'::jsonb);

  v_code := public.generate_backup_code();
  insert into public.recovery_codes (owner_id, code_hash)
  values (v_owner_id, encode(digest(v_code, 'sha256'), 'hex'));

  return query select v_owner_id, v_code;
end;
$$;

grant execute on function public.bootstrap_owner() to anon, authenticated;

-- Links the calling (anonymous) session to an existing owner via a
-- recovery code. This is the actual "restore my data" operation.
create or replace function public.claim_recovery_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_uid uuid := auth.uid();
  v_clean text := upper(regexp_replace(p_code, '[^a-zA-Z0-9]', '', 'g'));
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select rc.owner_id into v_owner_id
  from public.recovery_codes rc
  where rc.code_hash = encode(digest(v_clean, 'sha256'), 'hex');

  if v_owner_id is null then
    raise exception 'invalid code';
  end if;

  insert into public.identity_links (auth_uid, owner_id)
  values (v_uid, v_owner_id)
  on conflict (auth_uid) do update set owner_id = excluded.owner_id, linked_at = now();

  return v_owner_id;
end;
$$;

grant execute on function public.claim_recovery_code(text) to anon, authenticated;

-- Issues a fresh code for whichever owner the calling session is
-- currently linked to, invalidating the old one.
create or replace function public.regenerate_recovery_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_code text;
  v_uid uuid := auth.uid();
begin
  select il.owner_id into v_owner_id from public.identity_links il where il.auth_uid = v_uid;
  if v_owner_id is null then
    raise exception 'no backup linked to this session';
  end if;

  v_code := public.generate_backup_code();
  update public.recovery_codes
  set code_hash = encode(digest(v_code, 'sha256'), 'hex'), created_at = now()
  where owner_id = v_owner_id;

  return v_code;
end;
$$;

grant execute on function public.regenerate_recovery_code() to anon, authenticated;

-- Silent, no-code-needed check: is the calling session already linked to
-- an owner? Lets the app self-heal if only part of local storage was
-- lost while the Supabase auth session itself survived.
create or replace function public.current_owner()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select owner_id from public.identity_links where auth_uid = auth.uid();
$$;

grant execute on function public.current_owner() to anon, authenticated;