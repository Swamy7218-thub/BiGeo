-- FreightCheck core schema.
-- One company = one paying customer (a mid-market shipper). Everything else
-- hangs off it. See freightcheck/README.md for the workflow this maps to.

create extension if not exists "pgcrypto";

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'pilot' check (plan in ('pilot', 'starter', 'growth', 'unlimited')),
  created_at timestamptz not null default now()
);

create table transporters (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index transporters_company_id_idx on transporters(company_id);

create table rate_contracts (
  id uuid primary key default gen_random_uuid(),
  transporter_id uuid not null references transporters(id) on delete cascade,
  raw_file_url text not null,
  parsed_json jsonb,
  valid_from date,
  valid_to date,
  status text not null default 'pending_review' check (status in ('pending_review', 'confirmed')),
  created_at timestamptz not null default now()
);
create index rate_contracts_transporter_id_idx on rate_contracts(transporter_id);

create table rate_lines (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references rate_contracts(id) on delete cascade,
  origin text not null,
  destination text not null,
  vehicle_type text not null,
  rate numeric(12, 2) not null,
  rate_basis text not null check (rate_basis in ('per_trip', 'per_km', 'per_ton')),
  detention_free_days integer,
  detention_rate_per_day numeric(12, 2),
  diesel_escalation_clause text
);
create index rate_lines_contract_id_idx on rate_lines(contract_id);
create index rate_lines_lane_idx on rate_lines(contract_id, origin, destination, vehicle_type);

create table bills (
  id uuid primary key default gen_random_uuid(),
  transporter_id uuid not null references transporters(id) on delete cascade,
  bill_number text,
  bill_date date,
  raw_file_url text not null,
  status text not null default 'processing' check (status in ('processing', 'audited', 'reviewed')),
  total_claimed numeric(14, 2) not null default 0,
  total_approved numeric(14, 2) not null default 0,
  total_flagged numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index bills_transporter_id_idx on bills(transporter_id);

create table trip_lines (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  lr_number text,
  trip_date date,
  origin text not null,
  destination text not null,
  vehicle_number text,
  vehicle_type text,
  base_amount numeric(12, 2) not null,
  extra_charges_json jsonb not null default '[]',
  extraction_confidence numeric(3, 2) not null default 1.0,
  created_at timestamptz not null default now()
);
create index trip_lines_bill_id_idx on trip_lines(bill_id);
create index trip_lines_lr_number_idx on trip_lines(lr_number);
create index trip_lines_dup_fingerprint_idx on trip_lines(vehicle_number, trip_date, destination);

create table flags (
  id uuid primary key default gen_random_uuid(),
  trip_line_id uuid not null references trip_lines(id) on delete cascade,
  flag_type text not null check (
    flag_type in ('rate_mismatch', 'duplicate', 'detention_invalid', 'missing_pod', 'unknown_lane')
  ),
  expected_amount numeric(12, 2),
  claimed_amount numeric(12, 2),
  status text not null default 'open' check (status in ('open', 'accepted', 'waived')),
  message text,
  created_at timestamptz not null default now()
);
create index flags_trip_line_id_idx on flags(trip_line_id);

create table pods (
  id uuid primary key default gen_random_uuid(),
  trip_line_id uuid references trip_lines(id) on delete set null,
  file_url text not null,
  matched_by text check (matched_by in ('lr_number', 'manual')),
  created_at timestamptz not null default now()
);
create index pods_trip_line_id_idx on pods(trip_line_id);

-- Row Level Security: every table is scoped to the owning company via joins.
-- MVP runs single-tenant per deployment, but this keeps multi-tenant safe by default.
alter table companies enable row level security;
alter table transporters enable row level security;
alter table rate_contracts enable row level security;
alter table rate_lines enable row level security;
alter table bills enable row level security;
alter table trip_lines enable row level security;
alter table flags enable row level security;
alter table pods enable row level security;

-- Service role (used by the server-side API routes) bypasses RLS by default.
-- Authenticated dashboard users are scoped via company membership once auth ships;
-- until then, service-role-only access is the deliberate MVP boundary.
