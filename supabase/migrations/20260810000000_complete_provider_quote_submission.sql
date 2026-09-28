
create or replace function public.three_working_days_after(p_start timestamptz)
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
  while v_days_added < 3 loop
    v_deadline := v_deadline + interval '1 day';
    if extract(isodow from v_deadline) between 1 and 5 then
      v_days_added := v_days_added + 1;
    end if;
  end loop;
  return v_deadline;
end;
$$;

alter table public.job_requests
  alter column quote_deadline set default public.three_working_days_after(now()),
  alter column max_quotes set default 3;

update public.job_requests
set max_quotes = least(max_quotes, 3);

update public.job_requests
set quote_deadline = public.three_working_days_after(created_at)
where status = 'open';

alter table public.job_requests
  drop constraint if exists job_requests_max_quotes_check,
  add constraint job_requests_max_quotes_check check (max_quotes between 1 and 3);

alter table public.job_quotes
  drop constraint if exists job_quotes_message_check,
  drop constraint if exists job_quotes_status_check;

update public.job_quotes
set status = 'awaiting_response'
where status = 'submitted';

alter table public.job_quotes
  alter column message set default '',
  alter column status set default 'awaiting_response',
  add column price_type text not null default 'fixed',
  add column availability_date date not null default current_date,
  add column arrival_window text not null default 'To be confirmed',
  add column included_work text not null default 'As described in the quote message',
  add column conditions text not null default 'No additional conditions',
  add column expected_duration text not null default 'To be confirmed',
  add constraint job_quotes_message_check
    check (char_length(trim(message)) between 0 and 1000),
  add constraint job_quotes_price_type_check
    check (price_type in ('fixed', 'hourly', 'call_out')),
  add constraint job_quotes_arrival_window_check
    check (char_length(trim(arrival_window)) between 1 and 120),
  add constraint job_quotes_included_work_check
    check (char_length(trim(included_work)) between 1 and 1000),
  add constraint job_quotes_conditions_check
    check (char_length(trim(conditions)) between 1 and 1000),
  add constraint job_quotes_expected_duration_check
    check (char_length(trim(expected_duration)) between 1 and 120),
  add constraint job_quotes_status_check check (
    status in ('awaiting_response', 'accepted', 'rejected', 'withdrawn')
  );

alter table public.job_quotes
  alter column price_type drop default,
  alter column availability_date drop default,
  alter column arrival_window drop default,
  alter column included_work drop default,
  alter column conditions drop default,
  alter column expected_duration drop default;

drop function if exists public.submit_business_quote(uuid, uuid, integer, text);

create function public.submit_business_quote(
  p_business_id uuid,
  p_job_request_id uuid,
  p_price_type text,
  p_amount_cents integer,
  p_availability_date date,
  p_arrival_window text,
  p_included_work text,
  p_conditions text,
  p_expected_duration text,
  p_message text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
set timezone = 'Pacific/Auckland'
as $$
declare
  v_quote_id uuid;
  v_job_matches boolean;
begin
  if not public.business_has_capability(p_business_id, 'service_marketplace') then
    raise exception 'Service Marketplace access required' using errcode = '42501';
  end if;

  if p_price_type is null or p_price_type not in ('fixed', 'hourly', 'call_out') then
    raise exception 'Select a valid price type';
  end if;
  if p_amount_cents is null or p_amount_cents < 100 or p_amount_cents > 100000000 then
    raise exception 'Enter a valid quote price';
  end if;
  if p_availability_date is null or p_availability_date < current_date then
    raise exception 'Select a valid availability date';
  end if;
  if char_length(trim(coalesce(p_arrival_window, ''))) not between 1 and 120 then
    raise exception 'Enter a valid arrival window';
  end if;
  if char_length(trim(coalesce(p_included_work, ''))) not between 1 and 1000 then
    raise exception 'Describe the included work';
  end if;
  if char_length(trim(coalesce(p_conditions, ''))) not between 1 and 1000 then
    raise exception 'Enter the quote conditions';
  end if;
  if char_length(trim(coalesce(p_expected_duration, ''))) not between 1 and 120 then
    raise exception 'Enter the expected duration';
  end if;
  if char_length(trim(coalesce(p_message, ''))) > 1000 then
    raise exception 'Quote message cannot exceed 1000 characters';
  end if;

  perform 1
  from public.job_requests
  where id = p_job_request_id
  for update;

  select exists (
    select 1
    from public.job_requests as job
    where job.id = p_job_request_id
      and job.status = 'open'
      and now() <= public.three_working_days_after(job.created_at)
      and now() <= job.quote_deadline
      and (
        select count(*)
        from public.job_quotes as quote
        where quote.job_request_id = job.id
          and quote.status in ('awaiting_response', 'accepted')
      ) < 3
      and exists (
        select 1
        from public.business_service_categories as service_category
        where service_category.business_id = p_business_id
          and lower(trim(service_category.service_category::text)) =
            lower(trim(job.category::text))
      )
      and exists (
        select 1
        from public.business_service_areas as service_area
        where service_area.business_id = p_business_id
          and lower(trim(service_area.service_area::text)) in (
            lower(trim(job.suburb::text)),
            lower(trim(job.city::text))
          )
      )
  ) into v_job_matches;

  if not v_job_matches then
    raise exception 'This request is closed, outside its three-working-day window, or already has three quotes';
  end if;

  insert into public.job_quotes (
    job_request_id,
    business_id,
    price_type,
    amount_cents,
    availability_date,
    arrival_window,
    included_work,
    conditions,
    expected_duration,
    message,
    status
  )
  values (
    p_job_request_id,
    p_business_id,
    p_price_type,
    p_amount_cents,
    p_availability_date,
    trim(p_arrival_window),
    trim(p_included_work),
    trim(p_conditions),
    trim(p_expected_duration),
    trim(coalesce(p_message, '')),
    'awaiting_response'
  )
  on conflict (job_request_id, business_id) do update
  set
    price_type = excluded.price_type,
    amount_cents = excluded.amount_cents,
    availability_date = excluded.availability_date,
    arrival_window = excluded.arrival_window,
    included_work = excluded.included_work,
    conditions = excluded.conditions,
    expected_duration = excluded.expected_duration,
    message = excluded.message,
    status = 'awaiting_response'
  returning id into v_quote_id;

  return v_quote_id;
end;
$$;

drop function if exists public.get_business_quotes(uuid);
create function public.get_business_quotes(p_business_id uuid)
returns table (
  quote_id uuid,
  job_request_id uuid,
  title text,
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
    quote.status::text,
    quote.created_at::timestamptz
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.business_id = p_business_id
  order by quote.created_at desc;
end;
$$;

drop function if exists public.get_customer_job_quotes();
create function public.get_customer_job_quotes()
returns table (
  quote_id uuid,
  job_request_id uuid,
  business_id uuid,
  business_name text,
  price_type text,
  amount_cents integer,
  availability_date date,
  arrival_window text,
  included_work text,
  conditions text,
  expected_duration text,
  message text,
  quote_status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    quote.id::uuid,
    quote.job_request_id::uuid,
    quote.business_id::uuid,
    business.business_name::text,
    quote.price_type::text,
    quote.amount_cents::integer,
    quote.availability_date::date,
    quote.arrival_window::text,
    quote.included_work::text,
    quote.conditions::text,
    quote.expected_duration::text,
    quote.message::text,
    quote.status::text,
    quote.created_at::timestamptz
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  join public.businesses as business on business.id = quote.business_id
  where job.customer_id = (select auth.uid())
  order by quote.created_at desc;
$$;

create or replace function public.get_business_job_leads(p_business_id uuid)
returns table (
  job_request_id uuid,
  title text,
  description text,
  category text,
  city text,
  suburb text,
  radius_km integer,
  requested_timing text,
  quote_deadline timestamptz,
  quote_count integer,
  max_quotes integer,
  job_status text,
  created_at timestamptz,
  has_quote boolean
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
    job.id::uuid,
    job.title::text,
    job.description::text,
    job.category::text,
    job.city::text,
    job.suburb::text,
    job.radius_km::integer,
    job.requested_timing::text,
    least(job.quote_deadline, public.three_working_days_after(job.created_at))::timestamptz,
    quote_totals.quote_count::integer,
    3::integer,
    job.status::text,
    job.created_at::timestamptz,
    exists (
      select 1
      from public.job_quotes as own_quote
      where own_quote.job_request_id = job.id
        and own_quote.business_id = p_business_id
        and own_quote.status in ('awaiting_response', 'accepted')
    )::boolean
  from public.job_requests as job
  cross join lateral (
    select count(*)::integer as quote_count
    from public.job_quotes as quote
    where quote.job_request_id = job.id
      and quote.status in ('awaiting_response', 'accepted')
  ) as quote_totals
  where job.status = 'open'
    and now() <= public.three_working_days_after(job.created_at)
    and now() <= job.quote_deadline
    and quote_totals.quote_count < 3
    and exists (
      select 1
      from public.business_service_categories as service_category
      where service_category.business_id = p_business_id
        and lower(trim(service_category.service_category::text)) =
          lower(trim(job.category::text))
    )
    and exists (
      select 1
      from public.business_service_areas as service_area
      where service_area.business_id = p_business_id
        and lower(trim(service_area.service_area::text)) in (
          lower(trim(job.suburb::text)),
          lower(trim(job.city::text))
        )
    )
  order by job.created_at desc;
end;
$$;

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
  v_job_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select quote.job_request_id, quote.status
  into v_job_request_id, v_quote_status
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

  if v_quote_status = 'awaiting_response' then
    update public.job_quotes set status = 'rejected' where id = p_quote_id;
  end if;
  return 'rejected';
end;
$$;

revoke all on function public.three_working_days_after(timestamptz) from public;
revoke all on function public.submit_business_quote(uuid, uuid, text, integer, date, text, text, text, text, text) from public;
revoke all on function public.get_business_quotes(uuid) from public;
revoke all on function public.get_customer_job_quotes() from public;

grant execute on function public.three_working_days_after(timestamptz) to authenticated;
grant execute on function public.submit_business_quote(uuid, uuid, text, integer, date, text, text, text, text, text) to authenticated;
grant execute on function public.get_business_quotes(uuid) to authenticated;
grant execute on function public.get_customer_job_quotes() to authenticated;
