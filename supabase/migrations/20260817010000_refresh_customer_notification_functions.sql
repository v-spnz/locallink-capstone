-- Keep this as a separate migration because the original customer notification
-- migration has already been applied to hosted databases.

alter table public.customer_notifications
  drop constraint if exists customer_notifications_notification_type_check;

alter table public.customer_notifications
  add constraint customer_notifications_notification_type_check
  check (
    notification_type in (
      'new_quote',
      'quote_withdrawn',
      'job_completed',
      'job_scheduled',
      'on_the_way',
      'in_progress',
      'quote_deadline_reminder'
    )
  );

create or replace function public.notify_customer_about_new_quote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_job_title text;
  v_business_name text;
begin
  select job.customer_id, job.title
    into v_customer_id, v_job_title
  from public.job_requests as job
  where job.id = new.job_request_id;

  select business.business_name
    into v_business_name
  from public.businesses as business
  where business.id = new.business_id;

  insert into public.customer_notifications (
    customer_id, notification_type, title, message, destination,
    related_job_request_id, related_quote_id
  )
  values (
    v_customer_id,
    'new_quote',
    'New quote received',
    coalesce(v_business_name, 'A provider') || ' sent a quote on ' ||
      coalesce(v_job_title, 'your job') || '.',
    '/jobs?job=' || new.job_request_id || '&quote=' || new.id,
    new.job_request_id,
    new.id
  );

  return new;
end;
$$;

create or replace function public.notify_customer_about_quote_withdrawal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_job_title text;
  v_business_name text;
begin
  if old.status is not distinct from new.status or new.status <> 'withdrawn' then
    return new;
  end if;

  select job.customer_id, job.title
    into v_customer_id, v_job_title
  from public.job_requests as job
  where job.id = new.job_request_id;

  select business.business_name
    into v_business_name
  from public.businesses as business
  where business.id = new.business_id;

  insert into public.customer_notifications (
    customer_id, notification_type, title, message, destination,
    related_job_request_id, related_quote_id
  )
  values (
    v_customer_id,
    'quote_withdrawn',
    'Quote withdrawn',
    coalesce(v_business_name, 'A provider') || ' withdrew their quote on ' ||
      coalesce(v_job_title, 'your job') || '.',
    '/jobs?job=' || new.job_request_id,
    new.job_request_id,
    new.id
  );

  return new;
end;
$$;

create or replace function public.notify_customer_about_scheduled_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is not distinct from new.status or new.status <> 'scheduled' then
    return new;
  end if;

  insert into public.customer_notifications (
    customer_id, notification_type, title, message, destination, related_job_request_id
  )
  values (
    new.customer_id,
    'job_scheduled',
    'Job scheduled',
    coalesce(new.title, 'Your job') || ' has been scheduled.',
    '/jobs?job=' || new.id,
    new.id
  );

  return new;
end;
$$;

create or replace function public.notify_customer_about_on_the_way_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is not distinct from new.status or new.status <> 'on_the_way' then
    return new;
  end if;

  insert into public.customer_notifications (
    customer_id, notification_type, title, message, destination, related_job_request_id
  )
  values (
    new.customer_id,
    'on_the_way',
    'Job is on the way',
    coalesce(new.title, 'Your job') || ' is on the way.',
    '/jobs?job=' || new.id,
    new.id
  );

  return new;
end;
$$;

create or replace function public.notify_customer_about_in_progress_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is not distinct from new.status or new.status <> 'in_progress' then
    return new;
  end if;

  insert into public.customer_notifications (
    customer_id, notification_type, title, message, destination, related_job_request_id
  )
  values (
    new.customer_id,
    'in_progress',
    'Job is in progress',
    coalesce(new.title, 'Your job') || ' is currently in progress.',
    '/jobs?job=' || new.id,
    new.id
  );

  return new;
end;
$$;

create or replace function public.notify_customer_about_completed_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is not distinct from new.status or new.status <> 'completed' then
    return new;
  end if;

  insert into public.customer_notifications (
    customer_id, notification_type, title, message, destination, related_job_request_id
  )
  values (
    new.customer_id,
    'job_completed',
    'Job marked complete',
    coalesce(new.title, 'Your job') || ' has been marked complete.',
    '/jobs?job=' || new.id,
    new.id
  );

  return new;
end;
$$;

create or replace function public.notify_customers_about_upcoming_deadlines()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customer_notifications (
    customer_id, notification_type, title, message, destination, related_job_request_id
  )
  select
    job.customer_id,
    'quote_deadline_reminder',
    'Quote deadline approaching',
    'Quotes for ' || coalesce(job.title, 'your job') || ' close soon.',
    '/jobs?job=' || job.id,
    job.id
  from public.job_requests as job
  where job.quote_deadline between now() and now() + interval '2 days'
    and job.status = 'open'
    and not exists (
      select 1
      from public.customer_notifications as existing
      where existing.related_job_request_id = job.id
        and existing.notification_type = 'quote_deadline_reminder'
        and existing.created_at::date = current_date
    );
end;
$$;
