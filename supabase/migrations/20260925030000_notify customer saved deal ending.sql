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

create or replace function public.notify_customers_about_ending_saved_deals()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_business_deal_statuses();

  insert into public.customer_notifications (
    customer_id, notification_type, title, message, destination,
    related_deal_id
  )
  select
    saved.customer_id,
    'saved_deal_ending_soon',
    'Saved deal ending soon',
    coalesce(deal.title, 'A deal you saved') || ' at '
      || coalesce(business.business_name, 'this business') || ' ends '
      || to_char(deal.end_date, 'FMDD Mon') || ' — claim it before it''s gone.',
    '/deals?deal=' || deal.id,
    deal.id
  from public.saved_deals as saved
  join public.business_deals as deal on deal.id = saved.deal_id
  join public.businesses as business on business.id = deal.business_id
  where deal.status = 'active'
    and deal.end_date is not null
    and deal.end_date between current_date and current_date + 3
    and not exists (
      select 1
      from public.customer_notifications as existing
      where existing.customer_id = saved.customer_id
        and existing.related_deal_id = deal.id
        and existing.notification_type = 'saved_deal_ending_soon'
        and existing.created_at::date = current_date
    );
end;
$$;

revoke all on function public.notify_customers_about_ending_saved_deals()
  from public;

select cron.schedule(
  'saved-deal-ending-reminders',
  '0 21 * * *',
  $cron$select public.notify_customers_about_ending_saved_deals();$cron$
);