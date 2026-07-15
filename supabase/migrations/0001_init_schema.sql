-- FreightCheck core schema (PRD Section 17)
-- Engine: PostgreSQL via Supabase.

create extension if not exists "pgcrypto";

-- =========================================================================
-- Tables
-- =========================================================================

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'pilot' check (plan in ('pilot', 'starter', 'growth', 'enterprise')),
  pilot_started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- One row per auth.users member, scoped to a company.
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  email text not null unique,
  role text not null default 'clerk' check (role in ('clerk', 'finance_head', 'admin')),
  created_at timestamptz not null default now()
);

create index users_company_id_idx on users(company_id);

create table transporters (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  gstin text,
  created_at timestamptz not null default now()
);

create index transporters_company_id_idx on transporters(company_id);

create table rate_contracts (
  id uuid primary key default gen_random_uuid(),
  transporter_id uuid not null references transporters(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  raw_file_url text not null,
  parsed_json jsonb,
  valid_from date,
  valid_to date,
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  extraction_confidence numeric,
  created_at timestamptz not null default now()
);

create index rate_contracts_transporter_id_idx on rate_contracts(transporter_id);
create index rate_contracts_company_id_idx on rate_contracts(company_id);

create table rate_lines (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references rate_contracts(id) on delete cascade,
  origin text not null,
  destination text not null,
  vehicle_type text not null,
  rate numeric not null check (rate >= 0),
  rate_basis text not null check (rate_basis in ('per_trip', 'per_km', 'per_ton')),
  detention_free_days int not null default 0,
  detention_rate numeric not null default 0
);

create index rate_lines_contract_id_idx on rate_lines(contract_id);
create index rate_lines_lane_idx on rate_lines(contract_id, origin, destination, vehicle_type);

create table bills (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  transporter_id uuid not null references transporters(id) on delete cascade,
  bill_number text,
  bill_date date,
  raw_file_url text not null,
  file_hash text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'reviewed', 'failed')),
  total_claimed numeric not null default 0,
  total_approved numeric not null default 0,
  total_flagged numeric not null default 0,
  processing_error text,
  created_at timestamptz not null default now()
);

create index bills_company_id_idx on bills(company_id);
create index bills_transporter_id_idx on bills(transporter_id);
create index bills_file_hash_idx on bills(transporter_id, file_hash);

create table trip_lines (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  lr_number text,
  trip_date date,
  origin text,
  destination text,
  vehicle_number text,
  vehicle_type text,
  base_amount numeric not null default 0,
  extra_charges_json jsonb not null default '[]'::jsonb,
  extraction_confidence numeric not null default 1,
  needs_review boolean not null default false,
  created_at timestamptz not null default now()
);

create index trip_lines_bill_id_idx on trip_lines(bill_id);
create index trip_lines_lr_number_idx on trip_lines(lr_number);

create table flags (
  id uuid primary key default gen_random_uuid(),
  trip_line_id uuid not null references trip_lines(id) on delete cascade,
  flag_type text not null check (
    flag_type in ('rate_mismatch', 'duplicate', 'detention_invalid', 'missing_pod', 'unknown_lane', 'detention_date_mismatch', 'no_active_contract')
  ),
  reason text not null default '',
  expected_amount numeric,
  claimed_amount numeric,
  status text not null default 'open' check (status in ('open', 'accepted', 'waived', 'disputed')),
  related_bill_id uuid references bills(id),
  updated_by uuid references users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index flags_trip_line_id_idx on flags(trip_line_id);
create index flags_status_idx on flags(status);

create table pods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  trip_line_id uuid references trip_lines(id) on delete set null,
  file_url text not null,
  extracted_lr_number text,
  pod_date date,
  matched_by text check (matched_by in ('auto', 'manual')),
  created_at timestamptz not null default now()
);

create index pods_company_id_idx on pods(company_id);
create index pods_trip_line_id_idx on pods(trip_line_id);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  actor_id uuid references users(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_company_id_idx on audit_log(company_id);
create index audit_log_entity_idx on audit_log(entity_type, entity_id);

-- =========================================================================
-- Helper functions for RLS
-- =========================================================================

create or replace function auth_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from users where id = auth.uid();
$$;

create or replace function auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from users where id = auth.uid();
$$;

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table companies enable row level security;
alter table users enable row level security;
alter table transporters enable row level security;
alter table rate_contracts enable row level security;
alter table rate_lines enable row level security;
alter table bills enable row level security;
alter table trip_lines enable row level security;
alter table flags enable row level security;
alter table pods enable row level security;
alter table audit_log enable row level security;

-- companies: a user can read only their own company; admins (service role) bypass RLS.
create policy company_select on companies for select
  using (id = auth_company_id());
create policy company_update on companies for update
  using (id = auth_company_id() and auth_role() = 'finance_head');

-- users: members can see other members of their own company.
create policy users_select on users for select
  using (company_id = auth_company_id());
create policy users_insert_self on users for insert
  with check (id = auth.uid());

-- transporters
create policy transporters_all on transporters for all
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());

-- rate_contracts
create policy rate_contracts_all on rate_contracts for all
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());

-- rate_lines (scoped via parent contract's company)
create policy rate_lines_all on rate_lines for all
  using (exists (
    select 1 from rate_contracts rc
    where rc.id = rate_lines.contract_id and rc.company_id = auth_company_id()
  ))
  with check (exists (
    select 1 from rate_contracts rc
    where rc.id = rate_lines.contract_id and rc.company_id = auth_company_id()
  ));

-- bills
create policy bills_all on bills for all
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());

-- trip_lines (scoped via parent bill's company)
create policy trip_lines_all on trip_lines for all
  using (exists (
    select 1 from bills b where b.id = trip_lines.bill_id and b.company_id = auth_company_id()
  ))
  with check (exists (
    select 1 from bills b where b.id = trip_lines.bill_id and b.company_id = auth_company_id()
  ));

-- flags (scoped via trip_line -> bill -> company)
create policy flags_all on flags for all
  using (exists (
    select 1 from trip_lines tl
    join bills b on b.id = tl.bill_id
    where tl.id = flags.trip_line_id and b.company_id = auth_company_id()
  ))
  with check (exists (
    select 1 from trip_lines tl
    join bills b on b.id = tl.bill_id
    where tl.id = flags.trip_line_id and b.company_id = auth_company_id()
  ));

-- pods
create policy pods_all on pods for all
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());

-- audit_log: append-only from the app; readable by company members.
create policy audit_log_select on audit_log for select
  using (company_id = auth_company_id());
create policy audit_log_insert on audit_log for insert
  with check (company_id = auth_company_id());
