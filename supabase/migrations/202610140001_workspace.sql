begin;
create table public.workspace_collections (
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name in ('projects','clients','invoices')),
  records jsonb not null default '[]'::jsonb check (jsonb_typeof(records) = 'array'),
  revision integer not null default 1 check (revision > 0),
  primary key (user_id, name)
);
alter table public.workspace_collections enable row level security;
revoke all on public.workspace_collections from anon, authenticated;
grant select, insert, update on public.workspace_collections to authenticated;
create policy "Owners read collections" on public.workspace_collections for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners create collections" on public.workspace_collections for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update collections" on public.workspace_collections for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create function public.save_workspace_collection(expected_user_id uuid,collection_name text,new_records jsonb,expected_revision integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare next_revision integer;
begin
 if auth.uid() is null or auth.uid() <> expected_user_id then raise exception 'Sign in before saving.'; end if;
 if expected_revision = 0 then
  insert into public.workspace_collections(user_id,name,records,revision)
  values(auth.uid(),collection_name,new_records,1)
  on conflict do nothing returning revision into next_revision;
 else
  update public.workspace_collections set records=new_records,revision=revision+1
  where user_id=auth.uid() and name=collection_name and revision=expected_revision
  returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'Another device changed this collection. Export your changes, then refresh before continuing.'; end if;
 return next_revision;
end;
$$;
revoke all on function public.save_workspace_collection(uuid,text,jsonb,integer) from public, anon;
grant execute on function public.save_workspace_collection(uuid,text,jsonb,integer) to authenticated;
commit;
