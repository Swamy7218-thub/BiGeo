-- Move RLS helper functions to a non-exposed schema so they aren't
-- directly callable via PostgREST RPC (fixes Supabase security advisor
-- warnings: anon/authenticated_security_definer_function_executable).

create schema if not exists private;

create or replace function private.auth_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from users where id = auth.uid();
$$;

create or replace function private.auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from users where id = auth.uid();
$$;

revoke all on function private.auth_company_id() from public, anon, authenticated;
revoke all on function private.auth_role() from public, anon, authenticated;

-- Recreate policies to point at the private-schema versions.
drop policy company_select on companies;
drop policy company_update on companies;
create policy company_select on companies for select
  using (id = private.auth_company_id());
create policy company_update on companies for update
  using (id = private.auth_company_id() and private.auth_role() = 'finance_head');

drop policy users_select on users;
create policy users_select on users for select
  using (company_id = private.auth_company_id());

drop policy transporters_all on transporters;
create policy transporters_all on transporters for all
  using (company_id = private.auth_company_id())
  with check (company_id = private.auth_company_id());

drop policy rate_contracts_all on rate_contracts;
create policy rate_contracts_all on rate_contracts for all
  using (company_id = private.auth_company_id())
  with check (company_id = private.auth_company_id());

drop policy rate_lines_all on rate_lines;
create policy rate_lines_all on rate_lines for all
  using (exists (
    select 1 from rate_contracts rc
    where rc.id = rate_lines.contract_id and rc.company_id = private.auth_company_id()
  ))
  with check (exists (
    select 1 from rate_contracts rc
    where rc.id = rate_lines.contract_id and rc.company_id = private.auth_company_id()
  ));

drop policy bills_all on bills;
create policy bills_all on bills for all
  using (company_id = private.auth_company_id())
  with check (company_id = private.auth_company_id());

drop policy trip_lines_all on trip_lines;
create policy trip_lines_all on trip_lines for all
  using (exists (
    select 1 from bills b where b.id = trip_lines.bill_id and b.company_id = private.auth_company_id()
  ))
  with check (exists (
    select 1 from bills b where b.id = trip_lines.bill_id and b.company_id = private.auth_company_id()
  ));

drop policy flags_all on flags;
create policy flags_all on flags for all
  using (exists (
    select 1 from trip_lines tl
    join bills b on b.id = tl.bill_id
    where tl.id = flags.trip_line_id and b.company_id = private.auth_company_id()
  ))
  with check (exists (
    select 1 from trip_lines tl
    join bills b on b.id = tl.bill_id
    where tl.id = flags.trip_line_id and b.company_id = private.auth_company_id()
  ));

drop policy pods_all on pods;
create policy pods_all on pods for all
  using (company_id = private.auth_company_id())
  with check (company_id = private.auth_company_id());

drop policy audit_log_select on audit_log;
drop policy audit_log_insert on audit_log;
create policy audit_log_select on audit_log for select
  using (company_id = private.auth_company_id());
create policy audit_log_insert on audit_log for insert
  with check (company_id = private.auth_company_id());

drop policy "documents_select_own_company" on storage.objects;
drop policy "documents_insert_own_company" on storage.objects;
drop policy "documents_delete_own_company" on storage.objects;

create policy "documents_select_own_company"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (private.auth_company_id())::text
  );

create policy "documents_insert_own_company"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (private.auth_company_id())::text
  );

create policy "documents_delete_own_company"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (private.auth_company_id())::text
  );

drop function if exists public.auth_company_id();
drop function if exists public.auth_role();
