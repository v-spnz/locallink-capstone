-- Notify providers when an awaiting quote enters the final three working days
-- of the consumer response window. A scheduled run is used because database
-- triggers cannot react to time passing without a row change.

alter table public.business_notifications
  drop constraint if exists business_notifications_notification_type_check;

alter table public.business_notifications
  add constraint business_notifications_notification_type_check check (
    notification_type in (
      'new_lead',
      'quote_approved',
      'quote_updated',
      'job_completed',
      'quote_deadline_reminder'
    )
  );

create unique index if not exists business_notifications_one_quote_deadline_reminder_idx
  on public.business_notifications (related_quote_id)
  where notification_type = 'quote_deadline_reminder';

create or replace function public.two_working_days_after(p_start timestamptz)
returns timestamptz
language plpgsql
stable
set search_path = ''
set timezone = 'Pacific/Auckland'
as $$
declare
  v_threshold timestamptz := p_start;
  v_days_added integer := 0;
begin
  while v_days_added < 2 loop
    v_threshold := v_threshold + interval '1 day';
    if extract(isodow from v_threshold) between 1 and 5 then
      v_days_added := v_days_added + 1;
    end if;
  end loop;

  return v_threshold;
end;
$$;

create or replace function public.create_due_quote_deadline_notifications(
  p_now timestamptz default now()
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
set timezone = 'Pacific/Auckland'
as $$
declare
  v_created_count integer;
begin
  if p_now is null then
    raise exception 'Current time is required';
  end if;

  insert into public.business_notifications (
    business_id,
    notification_type,
    title,
    message,
    destination,
    related_job_request_id,
    related_quote_id,
    created_at
  )
  select
    quote.business_id,
    'quote_deadline_reminder',
    'Quote response deadline approaching',
    job.title || ' has entered the final three working days for a customer response.',
    '/business/services?tab=quotes',
    quote.job_request_id,
    quote.id,
    p_now
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.status = 'awaiting_response'
    and job.status = 'open'
    and p_now >= public.two_working_days_after(quote.created_at)
    and p_now <= public.five_working_days_after(quote.created_at)
  on conflict (related_quote_id)
    where notification_type = 'quote_deadline_reminder'
    do nothing;

  get diagnostics v_created_count = row_count;
  return v_created_count;
end;
$$;

revoke all on function public.two_working_days_after(timestamptz) from public;
revoke all on function public.create_due_quote_deadline_notifications(timestamptz) from public;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'create-due-quote-deadline-notifications-hourly',
  '0 * * * *',
  $schedule$select public.create_due_quote_deadline_notifications();$schedule$
);
