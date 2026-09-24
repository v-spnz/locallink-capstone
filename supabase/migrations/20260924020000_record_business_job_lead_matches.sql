-- Preserve the moment a new job request matches a service business. Business
-- notifications remain dismissible UI records and are not the analytics source.

create table public.business_job_lead_matches (
  business_id uuid not null references public.businesses(id) on delete cascade,
  job_request_id uuid not null
    references public.job_requests(id) on delete cascade,
  matched_at timestamptz not null default now(),
  primary key (business_id, job_request_id)
);

create index business_job_lead_matches_business_created_idx
  on public.business_job_lead_matches (business_id, matched_at);

alter table public.business_job_lead_matches enable row level security;

revoke all on table public.business_job_lead_matches from anon, authenticated;

comment on table public.business_job_lead_matches is
  'Durable analytics event recorded when the existing new-lead matching rules match a business.';

-- Backfill only evidence that still exists. Notifications dismissed before
-- this migration cannot be reconstructed without guessing.
insert into public.business_job_lead_matches (
  business_id,
  job_request_id,
  matched_at
)
select
  notification.business_id,
  notification.related_job_request_id,
  min(notification.created_at)
from public.business_notifications as notification
where notification.notification_type = 'new_lead'
  and notification.related_job_request_id is not null
group by notification.business_id, notification.related_job_request_id
on conflict (business_id, job_request_id) do nothing;

create or replace function public.notify_businesses_about_new_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'open' then
    return new;
  end if;

  with matched_businesses as materialized (
    select distinct category.business_id
    from public.business_service_categories as category
    join public.business_service_areas as area
      on area.business_id = category.business_id
    join public.business_capabilities as capability
      on capability.business_id = category.business_id
    where capability.service_marketplace_enabled
      and lower(trim(category.service_category)) = lower(trim(new.category))
      and lower(trim(area.service_area)) in (
        lower(trim(new.suburb)),
        lower(trim(new.city))
      )
  ),
  recorded_matches as (
    insert into public.business_job_lead_matches (
      business_id,
      job_request_id,
      matched_at
    )
    select business_id, new.id, now()
    from matched_businesses
    on conflict (business_id, job_request_id) do nothing
    returning business_id
  )
  insert into public.business_notifications (
    business_id,
    notification_type,
    title,
    message,
    destination,
    related_job_request_id
  )
  select
    matched.business_id,
    'new_lead',
    'New job opportunity',
    new.title || ' in ' || coalesce(new.suburb || ', ', '') || new.city,
    '/business/services?tab=leads',
    new.id
  from matched_businesses as matched
  on conflict (business_id, related_job_request_id)
    where notification_type = 'new_lead'
    do nothing;

  return new;
end;
$$;
