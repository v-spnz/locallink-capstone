
alter table public.job_requests
  add column if not exists measurements text;

alter table public.job_requests
  drop constraint if exists job_requests_measurements_check,
  add constraint job_requests_measurements_check check (
    measurements is null
    or char_length(trim(measurements)) between 1 and 500
  );

create table public.business_job_opportunity_declines (
  business_id uuid not null references public.businesses(id) on delete cascade,
  job_request_id uuid not null references public.job_requests(id) on delete cascade,
  declined_at timestamptz not null default now(),
  primary key (business_id, job_request_id)
);

create index business_job_opportunity_declines_job_idx
  on public.business_job_opportunity_declines(job_request_id);

alter table public.business_job_opportunity_declines enable row level security;

create or replace function public.decline_business_job_opportunity(
  p_business_id uuid,
  p_job_request_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.business_has_capability(p_business_id, 'service_marketplace') then
    raise exception 'Service Marketplace access required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.job_requests as job
    where job.id = p_job_request_id
      and job.status = 'open'
      and now() <= public.three_working_days_after(job.created_at)
      and now() <= job.quote_deadline
      and not exists (
        select 1
        from public.job_quotes as quote
        where quote.job_request_id = job.id
          and quote.business_id = p_business_id
          and quote.status in ('awaiting_response', 'accepted')
      )
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
  ) then
    raise exception 'This opportunity can no longer be declined';
  end if;

  insert into public.business_job_opportunity_declines (
    business_id,
    job_request_id
  )
  values (p_business_id, p_job_request_id)
  on conflict (business_id, job_request_id) do nothing;

  return true;
end;
$$;

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
  image_urls text[],
  measurements text,
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
    job.image_urls::text[],
    job.measurements::text,
    least(
      job.quote_deadline,
      public.three_working_days_after(job.created_at)
    )::timestamptz,
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
    and not exists (
      select 1
      from public.business_job_opportunity_declines as declined
      where declined.business_id = p_business_id
        and declined.job_request_id = job.id
    )
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

revoke all on function public.decline_business_job_opportunity(uuid, uuid) from public;
revoke all on function public.get_business_job_leads(uuid) from public;

grant execute on function public.decline_business_job_opportunity(uuid, uuid) to authenticated;
grant execute on function public.get_business_job_leads(uuid) to authenticated;
