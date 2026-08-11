-- US0068: provider quote outcome tracking, response windows, and withdrawal.

create or replace function public.five_working_days_after(p_start timestamptz)
returns timestamptz
language plpgsql
stable
set search_path = ''
set timezone = 'Pacific/Auckland'
as $$
declare
  v_deadline timestamptz := p_start;
  v_days_added integer := 0;
begin
  while v_days_added < 5 loop
    v_deadline := v_deadline + interval '1 day';
    if extract(isodow from v_deadline) between 1 and 5 then
      v_days_added := v_days_added + 1;
    end if;
  end loop;
  return v_deadline;
end;
$$;

drop function if exists public.get_business_quotes(uuid);
create function public.get_business_quotes(p_business_id uuid)
returns table (
  quote_id uuid,
  job_request_id uuid,
  title text,
  description text,
  category text,
  city text,
  suburb text,
  price_type text,
  amount_cents integer,
  availability_date date,
  arrival_window text,
  included_work text,
  conditions text,
  expected_duration text,
  message text,
  quote_status text,
  response_deadline timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.business_has_capability(p_business_id, 'service_marketplace') then
    raise exception 'Service Marketplace access required' using errcode = '42501';
  end if;

  return query
  select
    quote.id::uuid,
    job.id::uuid,
    job.title::text,
    job.description::text,
    job.category::text,
    job.city::text,
    job.suburb::text,
    quote.price_type::text,
    quote.amount_cents::integer,
    quote.availability_date::date,
    quote.arrival_window::text,
    quote.included_work::text,
    quote.conditions::text,
    quote.expected_duration::text,
    quote.message::text,
    case
      when quote.status = 'awaiting_response'
        and job.status in ('closed', 'cancelled') then 'request_withdrawn'
      when quote.status = 'awaiting_response'
        and now() > public.five_working_days_after(quote.created_at) then 'expired'
      when quote.status = 'rejected' then 'declined'
      else quote.status
    end::text,
    public.five_working_days_after(quote.created_at)::timestamptz,
    quote.created_at::timestamptz
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.business_id = p_business_id
  order by quote.created_at desc;
end;
$$;

create or replace function public.withdraw_business_quote(
  p_business_id uuid,
  p_quote_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote_status text;
  v_job_status text;
  v_created_at timestamptz;
begin
  if not public.business_has_capability(p_business_id, 'service_marketplace') then
    raise exception 'Service Marketplace access required' using errcode = '42501';
  end if;

  select quote.status, job.status, quote.created_at
  into v_quote_status, v_job_status, v_created_at
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.id = p_quote_id
    and quote.business_id = p_business_id
  for update of quote;

  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;

  if v_quote_status <> 'awaiting_response'
    or v_job_status <> 'open'
    or now() > public.five_working_days_after(v_created_at) then
    raise exception 'Only an awaiting quote can be withdrawn';
  end if;

  update public.job_quotes
  set status = 'withdrawn'
  where id = p_quote_id;

  return true;
end;
$$;

create or replace function public.prevent_withdrawn_quote_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'withdrawn' then
    raise exception 'A withdrawn quote can no longer be edited';
  end if;
  return new;
end;
$$;

drop trigger if exists job_quotes_prevent_withdrawn_changes on public.job_quotes;
create trigger job_quotes_prevent_withdrawn_changes
  before update on public.job_quotes
  for each row execute function public.prevent_withdrawn_quote_changes();

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
    if v_quote_status = 'accepted' and v_job_status = 'in_progress' then
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

    update public.job_quotes set status = 'accepted' where id = p_quote_id;
    update public.job_requests set status = 'in_progress' where id = v_job_request_id;
    return 'accepted';
  end if;

  if v_quote_status <> 'awaiting_response' or v_job_status <> 'open' then
    raise exception 'This quote can no longer be declined';
  end if;

  update public.job_quotes set status = 'rejected' where id = p_quote_id;
  return 'rejected';
end;
$$;

revoke all on function public.five_working_days_after(timestamptz) from public;
revoke all on function public.get_business_quotes(uuid) from public;
revoke all on function public.withdraw_business_quote(uuid, uuid) from public;

grant execute on function public.five_working_days_after(timestamptz) to authenticated;
grant execute on function public.get_business_quotes(uuid) to authenticated;
grant execute on function public.withdraw_business_quote(uuid, uuid) to authenticated;
