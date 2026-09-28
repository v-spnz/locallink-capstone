
alter table public.job_requests
  add column if not exists requested_timing text not null default 'Flexible',
  add column if not exists quote_deadline timestamptz not null default (now() + interval '7 days'),
  add column if not exists max_quotes integer not null default 5;

alter table public.job_requests
  drop constraint if exists job_requests_requested_timing_check,
  add constraint job_requests_requested_timing_check
    check (char_length(trim(requested_timing)) between 2 and 120),
  drop constraint if exists job_requests_max_quotes_check,
  add constraint job_requests_max_quotes_check check (max_quotes between 1 and 20);

create index if not exists job_requests_available_leads_idx
  on public.job_requests (quote_deadline, created_at desc)
  where status = 'open';

drop function if exists public.get_business_job_leads(uuid);

create function public.get_business_job_leads(p_business_id uuid)
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
    job.quote_deadline::timestamptz,
    quote_totals.quote_count::integer,
    job.max_quotes::integer,
    job.status::text,
    job.created_at::timestamptz,
    exists (
      select 1
      from public.job_quotes as own_quote
      where own_quote.job_request_id = job.id
        and own_quote.business_id = p_business_id
        and own_quote.status in ('submitted', 'accepted')
    )::boolean
  from public.job_requests as job
  cross join lateral (
    select count(*)::integer as quote_count
    from public.job_quotes as quote
    where quote.job_request_id = job.id
      and quote.status in ('submitted', 'accepted')
  ) as quote_totals
  where job.status = 'open'
    and job.quote_deadline > now()
    and quote_totals.quote_count < job.max_quotes
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

create or replace function public.submit_business_quote(
  p_business_id uuid,
  p_job_request_id uuid,
  p_amount_cents integer,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote_id uuid;
  v_job_matches boolean;
begin
  if not public.business_has_capability(p_business_id, 'service_marketplace') then
    raise exception 'Service Marketplace access required' using errcode = '42501';
  end if;

  if p_amount_cents < 100 or p_amount_cents > 100000000 then
    raise exception 'Enter a valid quote amount';
  end if;

  if char_length(trim(coalesce(p_message, ''))) < 10
    or char_length(trim(coalesce(p_message, ''))) > 1000 then
    raise exception 'Quote message must be between 10 and 1000 characters';
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
      and job.quote_deadline > now()
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
      and (
        exists (
          select 1
          from public.job_quotes as own_quote
          where own_quote.job_request_id = job.id
            and own_quote.business_id = p_business_id
            and own_quote.status in ('submitted', 'accepted')
        )
        or (
          select count(*)
          from public.job_quotes as quote
          where quote.job_request_id = job.id
            and quote.status in ('submitted', 'accepted')
        ) < job.max_quotes
      )
  ) into v_job_matches;

  if not v_job_matches then
    raise exception 'This job is not an available match';
  end if;

  insert into public.job_quotes (
    job_request_id,
    business_id,
    amount_cents,
    message,
    status
  )
  values (
    p_job_request_id,
    p_business_id,
    p_amount_cents,
    trim(p_message),
    'submitted'
  )
  on conflict (job_request_id, business_id) do update
  set
    amount_cents = excluded.amount_cents,
    message = excluded.message,
    status = 'submitted'
  returning id into v_quote_id;

  return v_quote_id;
end;
$$;

revoke all on function public.get_business_job_leads(uuid) from public;
revoke all on function public.submit_business_quote(uuid, uuid, integer, text) from public;
grant execute on function public.get_business_job_leads(uuid) to authenticated;
grant execute on function public.submit_business_quote(uuid, uuid, integer, text) to authenticated;
