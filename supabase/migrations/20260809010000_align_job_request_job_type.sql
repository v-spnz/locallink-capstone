-- Some existing projects have a required legacy job_type column. Keep it as
-- a compatibility alias of category so inserts work across old and fresh
-- databases without changing marketplace matching behaviour.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'job_requests'
      and column_name = 'job_type'
  ) then
    alter table public.job_requests add column job_type text;
    update public.job_requests set job_type = category;
    alter table public.job_requests alter column job_type set not null;
  end if;
end;
$$;
