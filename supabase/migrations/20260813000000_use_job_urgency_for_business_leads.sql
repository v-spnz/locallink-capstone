
drop function if exists public.get_business_job_leads(uuid);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'job_requests'
      and column_name = 'requested_timing'
  ) then
    execute $sql$
      update public.job_requests
      set urgency = case
        when lower(trim(requested_timing)) in ('urgent', 'asap')
          or lower(trim(requested_timing)) ~
            '(immediate|today|tomorrow|within (one|two|three|1|2|3) days|this weekend)'
          then 'Urgent'
        when lower(trim(requested_timing)) in ('flexible', 'no rush', 'whenever')
          then 'Flexible'
        else 'Normal'
      end
      where requested_timing is not null
        and trim(requested_timing) <> ''
    $sql$;
  end if;
end;
$$;

alter table public.job_requests
  drop constraint if exists job_requests_requested_timing_check,
  drop constraint if exists job_requests_measurements_check,
  drop constraint if exists job_requests_image_urls_check,
  drop column if exists requested_timing,
  drop column if exists measurements;

create function public.get_business_job_leads(p_business_id uuid)
returns table (
  job_request_id uuid,
  title text,
  description text,
  category text,
  city text,
  suburb text,
  radius_km integer,
  urgency text,
  image_urls text[],
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
    job.urgency::text,
    job.image_urls::text[],
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

revoke all on function public.get_business_job_leads(uuid) from public;
grant execute on function public.get_business_job_leads(uuid) to authenticated;
