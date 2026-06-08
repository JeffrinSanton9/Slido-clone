-- Polls Feature Schema for Supabase

-- ── polls ────────────────────────────────────────────────────────────────────
create table polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── poll_options ──────────────────────────────────────────────────────────────
create table poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- ── poll_votes ────────────────────────────────────────────────────────────────
-- Enforces one vote per voter per poll.
create table poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz default now(),
  unique (poll_id, voter_id)
);

create index poll_votes_poll_id_idx on poll_votes (poll_id);
