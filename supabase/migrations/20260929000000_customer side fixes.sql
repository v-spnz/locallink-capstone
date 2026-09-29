grant select, update on public.profiles to authenticated;



alter table public.customer_loyalty_scan_codes
  alter column expires_at set default (now() + interval '100 years');



create or replace function public.notify_customer_about_close_loyalty_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reward_threshold numeric;
  v_programme_name text;
  v_programme_status text;
  v_business_name text;
  v_old_progress numeric;
begin
  select programme.reward_threshold, programme.name, programme.status,
    business.business_name
  into v_reward_threshold, v_programme_name, v_programme_status,
    v_business_name
  from public.business_loyalty_programmes as programme
  join public.businesses as business on business.id = programme.business_id
  where programme.id = new.programme_id;

  if v_programme_status is distinct from 'active' or v_reward_threshold is null
  then
    return new;
  end if;

  v_old_progress := case when tg_op = 'INSERT' then null else old.current_progress end;

  if new.current_progress = v_reward_threshold - 1
    and (v_old_progress is null or v_old_progress <> v_reward_threshold - 1)
  then
    insert into public.customer_notifications (
      customer_id, notification_type, title, message, destination,
      related_loyalty_record_id
    )
    values (
      new.customer_id,
      'loyalty_reward_close',
      'Almost there!',
      'One more visit to ' || coalesce(v_business_name, 'this business')
        || ' and your reward on ' || coalesce(v_programme_name, 'your loyalty card')
        || ' is ready.',
      '/loyalty?record=' || new.id,
      new.id
    );
  end if;

  return new;
end;
$$;

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
    '/loyalty?record=' || record.id,
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