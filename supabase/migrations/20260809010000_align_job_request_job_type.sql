
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
