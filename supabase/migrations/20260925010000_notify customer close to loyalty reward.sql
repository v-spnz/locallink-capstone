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

alter table public.customer_notifications
  add column if not exists related_loyalty_record_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.customer_notifications'::regclass
      and conname = 'customer_notifications_related_loyalty_record_id_fkey'
  ) then
    alter table public.customer_notifications
      add constraint customer_notifications_related_loyalty_record_id_fkey
      foreign key (related_loyalty_record_id)
      references public.customer_loyalty_records(id) on delete set null;
  end if;
end;
$$;

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
      '/loyalty',
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists customer_loyalty_records_notify_close_to_reward
  on public.customer_loyalty_records;

create trigger customer_loyalty_records_notify_close_to_reward
  after insert or update of current_progress
  on public.customer_loyalty_records
  for each row execute function public.notify_customer_about_close_loyalty_progress();
