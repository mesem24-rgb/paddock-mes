begin;
insert into storage.buckets (id, name, public, file_size_limit)
values ('project-documents', 'project-documents', false, 3000000)
on conflict (id) do update set public = false, file_size_limit = 3000000;
drop policy if exists "Paddock owners upload documents" on storage.objects;
drop policy if exists "Paddock owners read documents" on storage.objects;
create policy "Paddock owners upload documents" on storage.objects
for insert to authenticated with check (
  bucket_id = 'project-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Paddock owners read documents" on storage.objects
for select to authenticated using (
  bucket_id = 'project-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
commit;
