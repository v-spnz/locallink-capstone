
create or replace function public.get_business_job_leads(p_business_id uuid)
returns table (
  job_request_id uuid,
  title text,
  description text,
  category text,
  city text,
  suburb text,
  radius_km integer,
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
    job.status::text,
    job.created_at::timestamptz,
    exists (
      select 1
      from public.job_quotes as quote
      where quote.job_request_id = job.id
        and quote.business_id = p_business_id
    )::boolean
  from public.job_requests as job
  where job.status = 'open'
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

create or replace function public.get_business_quotes(p_business_id uuid)
returns table (
  quote_id uuid,
  job_request_id uuid,
  title text,
  category text,
  city text,
  suburb text,
  amount_cents integer,
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
    quote.amount_cents::integer,
    quote.message::text,
    quote.status::text,
    quote.created_at::timestamptz
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.business_id = p_business_id
  order by quote.created_at desc;
end;
$$;

create or replace function public.get_business_active_jobs(p_business_id uuid)
returns table (
  job_request_id uuid,
  quote_id uuid,
  title text,
  description text,
  category text,
  city text,
  suburb text,
  amount_cents integer,
  job_status text,
  accepted_at timestamptz
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
    quote.id::uuid,
    job.title::text,
    job.description::text,
    job.category::text,
    job.city::text,
    job.suburb::text,
    quote.amount_cents::integer,
    job.status::text,
    quote.updated_at::timestamptz
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.business_id = p_business_id
    and quote.status = 'accepted'
    and job.status in ('in_progress', 'completed')
  order by quote.updated_at desc;
end;
$$;

create or replace function public.get_customer_job_quotes()
returns table (
  quote_id uuid,
  job_request_id uuid,
  business_id uuid,
  business_name text,
  amount_cents integer,
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
    quote.amount_cents::integer,
    quote.message::text,
    quote.status::text,
    quote.created_at::timestamptz
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  join public.businesses as business on business.id = quote.business_id
  where job.customer_id = (select auth.uid())
  order by quote.created_at desc;
$$;

grant execute on function public.get_business_job_leads(uuid) to authenticated;
grant execute on function public.get_business_quotes(uuid) to authenticated;
grant execute on function public.get_business_active_jobs(uuid) to authenticated;
grant execute on function public.get_customer_job_quotes() to authenticated;
