-- Private storage bucket for bills, rate contracts, and PODs.
-- Object path convention: {company_id}/{entity}/{filename}

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 26214400)
on conflict (id) do nothing;

create policy "documents_select_own_company"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (auth_company_id())::text
  );

create policy "documents_insert_own_company"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (auth_company_id())::text
  );

create policy "documents_delete_own_company"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (auth_company_id())::text
  );
