-- Address performance advisor findings: wrap auth.uid() in a scalar
-- subquery so it's evaluated once per statement, not once per row; add
-- covering indexes for foreign keys used in joins.

drop policy users_insert_self on users;
create policy users_insert_self on users for insert
  with check (id = (select auth.uid()));

create index audit_log_actor_id_idx on audit_log(actor_id);
create index flags_related_bill_id_idx on flags(related_bill_id);
