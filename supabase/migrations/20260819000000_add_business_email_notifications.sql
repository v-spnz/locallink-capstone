-- US0075: deliver provider notifications by email without coupling external
-- email requests to the transaction that creates a job or updates a quote.
-- Deadline reminder emails are intentionally deferred to a later change.

alter table public.business_notifications
  drop constraint if exists business_notifications_notification_type_check;

alter table public.business_notifications
  add constraint business_notifications_notification_type_check check (
    notification_type in (
      'new_lead',
      'quote_approved',
      'quote_declined',
      'quote_updated',
      'job_completed',
      'quote_deadline_reminder'
    )
  );

create unique index if not exists business_notifications_one_new_lead_event_idx
  on public.business_notifications (business_id, related_job_request_id)
  where notification_type = 'new_lead';

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

  insert into public.business_notifications (
    business_id,
    notification_type,
    title,
    message,
    destination,
    related_job_request_id
  )
  select distinct
    category.business_id,
    'new_lead',
    'New job opportunity',
    new.title || ' in ' || coalesce(new.suburb || ', ', '') || new.city,
    '/business/services?tab=leads',
    new.id
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
  on conflict (business_id, related_job_request_id)
    where notification_type = 'new_lead'
    do nothing;

  return new;
end;
$$;

create or replace function public.notify_business_about_quote_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job_title text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  select job.title into v_job_title
  from public.job_requests as job
  where job.id = new.job_request_id;

  if new.status = 'accepted' then
    insert into public.business_notifications (
      business_id,
      notification_type,
      title,
      message,
      destination,
      related_job_request_id,
      related_quote_id
    )
    values (
      new.business_id,
      'quote_approved',
      'Quote accepted',
      coalesce(v_job_title, 'Your quote') || ' was accepted by the customer.',
      '/business/services?tab=jobs',
      new.job_request_id,
      new.id
    );
  elsif new.status = 'rejected' then
    insert into public.business_notifications (
      business_id,
      notification_type,
      title,
      message,
      destination,
      related_job_request_id,
      related_quote_id
    )
    values (
      new.business_id,
      'quote_declined',
      'Quote declined',
      coalesce(v_job_title, 'Your quote') || ' was declined by the customer.',
      '/business/services?tab=quotes',
      new.job_request_id,
      new.id
    );
  else
    insert into public.business_notifications (
      business_id,
      notification_type,
      title,
      message,
      destination,
      related_job_request_id,
      related_quote_id
    )
    values (
      new.business_id,
      'quote_updated',
      'Quote updated',
      coalesce(v_job_title, 'Your quote') || ' is now ' ||
        replace(new.status, '_', ' ') || '.',
      '/business/services?tab=quotes',
      new.job_request_id,
      new.id
    );
  end if;

  return new;
end;
$$;

create table public.business_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id bigint not null
    references public.business_notifications(id) on delete cascade,
  recipient_profile_id uuid not null
    references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'sent', 'failed')
  ),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  provider_message_id text,
  last_error text,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (notification_id, recipient_profile_id)
);

create index business_email_deliveries_pending_idx
  on public.business_email_deliveries (created_at)
  where sent_at is null;

alter table public.business_email_deliveries enable row level security;

create or replace function public.queue_business_notification_emails()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.notification_type not in (
    'new_lead',
    'quote_approved',
    'quote_declined'
  ) then
    return new;
  end if;

  insert into public.business_email_deliveries (
    notification_id,
    recipient_profile_id
  )
  select new.id, member.profile_id
  from public.business_members as member
  where member.business_id = new.business_id
  on conflict (notification_id, recipient_profile_id) do nothing;

  return new;
end;
$$;

create trigger business_notifications_queue_email
  after insert on public.business_notifications
  for each row execute function public.queue_business_notification_emails();

revoke all on table public.business_email_deliveries from public;
grant select on table public.business_notifications to service_role;
grant select, update on table public.business_email_deliveries to service_role;
revoke all on function public.queue_business_notification_emails() from public;
