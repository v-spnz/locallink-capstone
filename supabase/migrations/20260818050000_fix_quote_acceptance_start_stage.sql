-- Reassert the ordered job workflow after accepting a quote. The hosted
-- database drifted back to the legacy implementation, which moved a newly
-- accepted job directly from Open to In progress and skipped the first three
-- visible timeline stages.
create or replace function public.respond_to_job_quote(
  p_quote_id uuid,
  p_accept boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job_request_id uuid;
  v_quote_status text;
  v_quote_created_at timestamptz;
  v_job_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select quote.job_request_id, quote.status, quote.created_at
  into v_job_request_id, v_quote_status, v_quote_created_at
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.id = p_quote_id
    and job.customer_id = auth.uid();

  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;

  select status into v_job_status
  from public.job_requests
  where id = v_job_request_id
  for update;

  if v_quote_status = 'awaiting_response'
    and now() > public.five_working_days_after(v_quote_created_at) then
    raise exception 'The five-working-day response period has expired';
  end if;

  if p_accept then
    if v_quote_status = 'accepted'
      and v_job_status in (
        'accepted',
        'scheduled',
        'on_the_way',
        'in_progress',
        'pending_completion',
        'completed'
      ) then
      return 'accepted';
    end if;

    if v_quote_status <> 'awaiting_response' or v_job_status <> 'open' then
      raise exception 'This quote can no longer be accepted';
    end if;

    update public.job_quotes
    set status = 'rejected'
    where job_request_id = v_job_request_id
      and id <> p_quote_id
      and status = 'awaiting_response';

    update public.job_quotes
    set status = 'accepted'
    where id = p_quote_id;

    update public.job_requests
    set status = 'accepted'
    where id = v_job_request_id;

    return 'accepted';
  end if;

  if v_quote_status <> 'awaiting_response' or v_job_status <> 'open' then
    raise exception 'This quote can no longer be declined';
  end if;

  update public.job_quotes
  set status = 'rejected'
  where id = p_quote_id;

  return 'rejected';
end;
$$;

revoke all on function public.respond_to_job_quote(uuid, boolean) from public;
grant execute on function public.respond_to_job_quote(uuid, boolean) to authenticated;
