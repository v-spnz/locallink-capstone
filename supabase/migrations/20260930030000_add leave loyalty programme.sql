create or replace function public.leave_loyalty_programme(
  p_loyalty_record_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from public.customer_loyalty_records
  where id = p_loyalty_record_id
    and customer_id = auth.uid();

  if not found then
    raise exception 'Loyalty record not found' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.leave_loyalty_programme(uuid) from public;
grant execute on function public.leave_loyalty_programme(uuid) to authenticated;