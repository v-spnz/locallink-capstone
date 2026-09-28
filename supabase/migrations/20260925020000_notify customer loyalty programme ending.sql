alter table public.customer_notifications
  drop constraint if exists customer_notifications_notification_type_check;
alter table public.customer_notifications
  add constraint customer_notifications_notification_type_check check (
    notification_type in (
      'new_quote',
      'quote_withdrawn',
      'job_completed',
      'job_scheduled',
      'on_the_way',
      'in_progress',
      'quote_deadline_reminder',
      'deal_ended',
      'loyalty_reward_close',
      'loyalty_programme_ending_soon',
      'saved_deal_ending_soon'
    )
  );

create or replace function public.notify_customers_about_expiring_loyalty_programmes()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customer_notifications (
    customer_id, notification_type, title, message, destination,
    related_loyalty_record_id
  )
  select
    record.customer_id,
    'loyalty_programme_ending_soon',
    'Loyalty programme ending soon',
    coalesce(business.business_name, 'A business') || '''s '
      || coalesce(programme.name, 'loyalty programme') || ' ends '
      || to_char(programme.end_date, 'FMDD Mon') || ' — visit soon to use it.',
    '/loyalty',
    record.id
  from public.customer_loyalty_records as record
  join public.business_loyalty_programmes as programme
    on programme.id = record.programme_id
  join public.businesses as business on business.id = programme.business_id
  where programme.status = 'active'
    and programme.end_date is not null
    and programme.end_date between current_date and current_date + 3
    and not exists (
      select 1
      from public.customer_notifications as existing
      where existing.related_loyalty_record_id = record.id
        and existing.notification_type = 'loyalty_programme_ending_soon'
        and existing.created_at::date = current_date
    );
end;
$$;

revoke all on function public.notify_customers_about_expiring_loyalty_programmes()
  from public;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'loyalty-programme-ending-reminders',
  '0 21 * * *',
  $cron$select public.notify_customers_about_expiring_loyalty_programmes();$cron$
);
