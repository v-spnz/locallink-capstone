alter table public.business_loyalty_programmes
  add column if not exists ended_at timestamptz,
  add column if not exists early_end_completion_deadline date;

alter table public.business_loyalty_programmes
  drop constraint if exists business_loyalty_programmes_status_check;

alter table public.business_loyalty_programmes
  add constraint business_loyalty_programmes_status_check check (
    status in ('draft', 'scheduled', 'active', 'expired', 'ended_early')
  );

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
      'saved_deal_ending_soon',
      'loyalty_programme_ended_early'
    )
  );

create or replace function public.fifteen_business_days_after(p_date date)
returns date
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  v_date date := p_date;
  v_days integer := 0;
begin
  while v_days < 15 loop
    v_date := v_date + 1;
    if extract(isodow from v_date) between 1 and 5 then
      v_days := v_days + 1;
    end if;
  end loop;
  return v_date;
end;
$$;

create or replace function public.loyalty_programme_accepts_existing_activity(
  p_status text,
  p_deadline date,
  p_today date default (now() at time zone 'Pacific/Auckland')::date
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_status = 'active'
    or (
      p_status = 'ended_early'
      and p_deadline is not null
      and p_deadline >= p_today
    );
$$;

create or replace function public.validate_published_loyalty_programme()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_local_today date := (now() at time zone 'Pacific/Auckland')::date;
  v_threshold_label text;
  v_reward_value_label text;
begin
  if new.reward_threshold is not null then
    v_threshold_label := trim(trailing '.' from trim(trailing '0' from new.reward_threshold::text));
  end if;
  if new.reward_value is not null then
    v_reward_value_label := trim(trailing '.' from trim(trailing '0' from new.reward_value::text));
  end if;

  if new.programme_type = 'purchase_card' then
    new.reward_value := null;
    new.reward_description := 'Next purchase free';
    new.earning_rules := case when v_threshold_label is not null then format('Complete %s purchases to receive the next purchase free.', v_threshold_label) else null end;
  elsif new.programme_type = 'visit_card' then
    new.reward_value := null;
    new.reward_description := 'Next visit free';
    new.earning_rules := case when v_threshold_label is not null then format('Complete %s visits to receive the next visit free.', v_threshold_label) else null end;
  elsif new.programme_type = 'spend_and_save' then
    new.reward_description := case when v_reward_value_label is not null then format('%s%% off', v_reward_value_label) else null end;
    new.earning_rules := case when v_threshold_label is not null and v_reward_value_label is not null then format('Spend $%s to receive %s%% off.', v_threshold_label, v_reward_value_label) else null end;
  elsif new.programme_type = 'spend_and_reward' then
    new.reward_value := null;
    new.reward_description := nullif(trim(new.reward_description), '');
    new.earning_rules := case when v_threshold_label is not null and new.reward_description is not null then format('Spend $%s to receive a free %s.', v_threshold_label, new.reward_description) else null end;
  else
    new.earning_rules := null;
  end if;

  if new.status = 'draft' then
    new.published_at := null;
    new.ended_at := null;
    new.early_end_completion_deadline := null;
    return new;
  end if;

  if new.status not in ('published', 'scheduled', 'active', 'expired', 'ended_early') then
    raise exception 'Invalid loyalty programme status' using errcode = '23514';
  end if;

  if new.name is null
    or char_length(trim(new.name)) not between 3 and 120
    or new.programme_type not in ('purchase_card', 'visit_card', 'spend_and_save', 'spend_and_reward')
    or new.reward_threshold is null
    or new.reward_threshold not between 1 and 1000000
    or (new.programme_type in ('purchase_card', 'visit_card') and new.reward_threshold <> trunc(new.reward_threshold))
    or (new.programme_type = 'spend_and_save' and (new.reward_value is null or new.reward_value > new.reward_threshold))
    or (new.programme_type = 'spend_and_reward' and (new.reward_description is null or char_length(new.reward_description) not between 3 and 240))
    or new.earning_rules is null
    or char_length(new.earning_rules) not between 10 and 500
    or new.start_date is null
    or (new.status not in ('expired', 'ended_early') and new.end_date is not null and new.end_date < v_local_today)
  then
    raise exception 'Complete every required loyalty programme field before publishing' using errcode = '23514';
  end if;

  new.published_at := coalesce(new.published_at, now());
  if new.join_code is null then
    new.join_code := 'LJ-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4)) || '-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4));
  end if;
  if new.status = 'published' then
    new.status := case when new.start_date > v_local_today then 'scheduled' else 'active' end;
  end if;
  return new;
end;
$$;

create or replace function public.save_business_loyalty_programme(
  p_programme_id uuid,
  p_business_id uuid,
  p_name text,
  p_programme_type text,
  p_reward_description text,
  p_reward_threshold numeric,
  p_reward_value numeric,
  p_terms text,
  p_start_date date,
  p_end_date date,
  p_status text,
  p_image_url text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_programme_id uuid;
begin
  if p_status not in ('draft', 'published') then
    raise exception 'Invalid loyalty programme status' using errcode = '22023';
  end if;
  if p_programme_id is not null then
    update public.business_loyalty_programmes
    set name = p_name,
      programme_type = p_programme_type,
      reward_description = p_reward_description,
      reward_threshold = p_reward_threshold,
      reward_value = p_reward_value,
      terms = p_terms,
      start_date = p_start_date,
      end_date = p_end_date,
      image_url = p_image_url,
      status = 'draft'
    where id = p_programme_id
      and business_id = p_business_id
      and status in ('draft', 'scheduled')
    returning id into v_programme_id;
  end if;
  if v_programme_id is null then
    insert into public.business_loyalty_programmes (
      id, business_id, name, programme_type, reward_description,
      reward_threshold, reward_value, terms, start_date, end_date,
      image_url, status
    ) values (
      coalesce(p_programme_id, gen_random_uuid()), p_business_id, p_name,
      p_programme_type, p_reward_description, p_reward_threshold,
      p_reward_value, p_terms, p_start_date, p_end_date, p_image_url, 'draft'
    ) returning id into v_programme_id;
  end if;
  if p_status = 'published' then
    update public.business_loyalty_programmes set status = 'published'
    where id = v_programme_id;
  end if;
  return v_programme_id;
end;
$$;

create or replace function public.delete_business_loyalty_programme_draft(
  p_programme_id uuid,
  p_business_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted_id uuid;
begin
  if auth.uid() is null or not public.business_has_capability(p_business_id, 'loyalty') then
    raise exception 'Business loyalty access required' using errcode = '42501';
  end if;
  delete from public.business_loyalty_programmes
  where id = p_programme_id and business_id = p_business_id and status = 'draft'
  returning id into v_deleted_id;
  if v_deleted_id is null then
    raise exception 'Draft loyalty programme not found' using errcode = 'P0002';
  end if;
  return v_deleted_id;
end;
$$;

create or replace function public.cancel_business_loyalty_programme_schedule(
  p_programme_id uuid,
  p_business_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_programme_id uuid;
begin
  if auth.uid() is null or not public.business_has_capability(p_business_id, 'loyalty') then
    raise exception 'Business loyalty access required' using errcode = '42501';
  end if;
  update public.business_loyalty_programmes
  set status = 'draft', join_code = null
  where id = p_programme_id and business_id = p_business_id and status = 'scheduled'
  returning id into v_programme_id;
  if v_programme_id is null then
    raise exception 'Scheduled loyalty programme not found' using errcode = 'P0002';
  end if;
  return v_programme_id;
end;
$$;

create or replace function public.get_business_loyalty_programme_end_summary(
  p_programme_id uuid,
  p_business_id uuid
)
returns table (customer_count bigint, completion_deadline date)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_end_date date;
  v_today date := (now() at time zone 'Pacific/Auckland')::date;
begin
  if auth.uid() is null or not public.business_has_capability(p_business_id, 'loyalty') then
    raise exception 'Business loyalty access required' using errcode = '42501';
  end if;
  select programme.end_date into v_end_date
  from public.business_loyalty_programmes programme
  where programme.id = p_programme_id
    and programme.business_id = p_business_id
    and programme.status = 'active';
  if not found then
    raise exception 'Active loyalty programme not found' using errcode = 'P0002';
  end if;
  return query select count(record.id), least(
    public.fifteen_business_days_after(v_today),
    coalesce(v_end_date, 'infinity'::date)
  )
  from public.customer_loyalty_records record
  where record.programme_id = p_programme_id;
end;
$$;

create or replace function public.end_business_loyalty_programme_early(
  p_programme_id uuid,
  p_business_id uuid
)
returns table (
  programme_id uuid,
  customer_count bigint,
  notifications_created bigint,
  completion_deadline date
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_end_date date;
  v_name text;
  v_business_name text;
  v_deadline date;
  v_customer_count bigint;
  v_notifications bigint;
  v_today date := (now() at time zone 'Pacific/Auckland')::date;
begin
  if auth.uid() is null or not public.business_has_capability(p_business_id, 'loyalty') then
    raise exception 'Business loyalty access required' using errcode = '42501';
  end if;
  select programme.end_date, programme.name, business.business_name
  into v_end_date, v_name, v_business_name
  from public.business_loyalty_programmes programme
  join public.businesses business on business.id = programme.business_id
  where programme.id = p_programme_id
    and programme.business_id = p_business_id
    and programme.status = 'active'
  for update of programme;
  if not found then
    raise exception 'Active loyalty programme not found' using errcode = 'P0002';
  end if;
  v_deadline := least(
    public.fifteen_business_days_after(v_today),
    coalesce(v_end_date, 'infinity'::date)
  );
  update public.business_loyalty_programmes
  set status = 'ended_early',
    ended_at = now(),
    early_end_completion_deadline = v_deadline
  where id = p_programme_id;
  select count(*) into v_customer_count
  from public.customer_loyalty_records
  where customer_loyalty_records.programme_id = p_programme_id;
  insert into public.customer_notifications (
    customer_id, notification_type, title, message, destination,
    related_loyalty_record_id
  )
  select record.customer_id,
    'loyalty_programme_ended_early',
    'Loyalty programme ended early',
    coalesce(v_business_name, 'A business') || '''s ' || coalesce(v_name, 'loyalty programme') || ' ended early. You can complete or redeem it until ' || to_char(v_deadline, 'FMDD Mon YYYY') || '.',
    '/loyalty?record=' || record.id,
    record.id
  from public.customer_loyalty_records record
  where record.programme_id = p_programme_id;
  get diagnostics v_notifications = row_count;
  return query select p_programme_id, v_customer_count, v_notifications, v_deadline;
end;
$$;

drop function if exists public.get_my_loyalty_records();

create function public.get_my_loyalty_records()
returns table (
  loyalty_record_id uuid,
  loyalty_identifier text,
  business_name text,
  programme_id uuid,
  programme_name text,
  programme_type text,
  programme_status text,
  current_progress numeric,
  reward_threshold numeric,
  reward_description text,
  reward_value numeric,
  earning_rules text,
  reward_eligible boolean,
  updated_at timestamptz,
  early_end_completion_deadline date
)
language sql
stable
security definer
set search_path = ''
as $$
  select record.id, record.loyalty_identifier, business.business_name,
    programme.id, programme.name, programme.programme_type, programme.status,
    record.current_progress, programme.reward_threshold,
    programme.reward_description, programme.reward_value,
    programme.earning_rules,
    public.loyalty_programme_accepts_existing_activity(programme.status, programme.early_end_completion_deadline)
      and record.current_progress >= programme.reward_threshold,
    record.updated_at, programme.early_end_completion_deadline
  from public.customer_loyalty_records record
  join public.business_loyalty_programmes programme on programme.id = record.programme_id
  join public.businesses business on business.id = programme.business_id
  where record.customer_id = (select auth.uid()) and programme.status <> 'draft'
  order by record.updated_at desc;
$$;

create or replace function public.create_my_loyalty_scan_code(p_loyalty_record_id uuid)
returns table (scan_code text, expires_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.customer_loyalty_records record
    join public.business_loyalty_programmes programme on programme.id = record.programme_id
    where record.id = p_loyalty_record_id
      and record.customer_id = auth.uid()
      and public.loyalty_programme_accepts_existing_activity(programme.status, programme.early_end_completion_deadline)
  ) then return; end if;
  delete from public.customer_loyalty_scan_codes code where code.loyalty_record_id = p_loyalty_record_id;
  return query insert into public.customer_loyalty_scan_codes (loyalty_record_id)
    values (p_loyalty_record_id)
    returning customer_loyalty_scan_codes.scan_code, customer_loyalty_scan_codes.expires_at;
end;
$$;

create or replace function public.lookup_business_loyalty_record(p_business_id uuid, p_loyalty_identifier text)
returns table (
  loyalty_record_id uuid, loyalty_identifier text, customer_display_name text,
  programme_id uuid, programme_name text, programme_type text,
  programme_status text, current_progress numeric, reward_threshold numeric,
  reward_description text, reward_value numeric, earning_rules text,
  reward_eligible boolean, updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_normalised_identifier text := upper(regexp_replace(regexp_replace(coalesce(p_loyalty_identifier, ''), '^.*:', ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if auth.uid() is null or not public.business_has_capability(p_business_id, 'loyalty') or v_normalised_identifier !~ '^(LL[A-Z0-9]{8}|[A-Z0-9]{12})$' then return; end if;
  return query
  select record.id, record.loyalty_identifier,
    concat_ws(' ', nullif(trim(customer.first_name), ''), case when nullif(trim(customer.last_name), '') is not null then upper(left(trim(customer.last_name), 1)) || '.' else null end),
    programme.id, programme.name, programme.programme_type, programme.status,
    record.current_progress, programme.reward_threshold,
    programme.reward_description, programme.reward_value,
    programme.earning_rules,
    public.loyalty_programme_accepts_existing_activity(programme.status, programme.early_end_completion_deadline)
      and record.current_progress >= programme.reward_threshold,
    record.updated_at
  from public.customer_loyalty_records record
  join public.business_loyalty_programmes programme on programme.id = record.programme_id
  join public.profiles customer on customer.id = record.customer_id
  left join public.customer_loyalty_scan_codes scan_code
    on scan_code.loyalty_record_id = record.id
    and scan_code.scan_code = v_normalised_identifier
    and scan_code.expires_at >= now()
  where programme.business_id = p_business_id
    and (upper(regexp_replace(record.loyalty_identifier, '[^A-Za-z0-9]', '', 'g')) = v_normalised_identifier or scan_code.id is not null)
  limit 1;
end;
$$;

create or replace function public.add_loyalty_progress(p_loyalty_record_id uuid, p_amount numeric default 1)
returns table (
  loyalty_record_id uuid, loyalty_identifier text, customer_display_name text,
  programme_id uuid, programme_name text, programme_type text,
  programme_status text, current_progress numeric, reward_threshold numeric,
  reward_description text, reward_value numeric, earning_rules text,
  reward_eligible boolean, updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_business_id uuid; v_status text; v_deadline date; v_threshold numeric;
  v_previous numeric; v_new numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Progress amount must be a positive number' using errcode = '22023'; end if;
  perform public.refresh_loyalty_programme_statuses();
  select programme.business_id, programme.status, programme.early_end_completion_deadline,
    programme.reward_threshold, record.current_progress
  into v_business_id, v_status, v_deadline, v_threshold, v_previous
  from public.customer_loyalty_records record
  join public.business_loyalty_programmes programme on programme.id = record.programme_id
  where record.id = p_loyalty_record_id for update of record;
  if v_business_id is null then raise exception 'Loyalty record not found' using errcode = '42501'; end if;
  if not public.business_has_capability(v_business_id, 'loyalty') then raise exception 'Not authorized' using errcode = '42501'; end if;
  if not public.loyalty_programme_accepts_existing_activity(v_status, v_deadline) then raise exception 'Loyalty programme is not active' using errcode = '55000'; end if;
  update public.customer_loyalty_records record set current_progress = record.current_progress + p_amount
  where record.id = p_loyalty_record_id returning record.current_progress into v_new;
  insert into public.loyalty_activity (loyalty_record_id, activity_type, amount) values (p_loyalty_record_id, 'progress_added', p_amount);
  if v_previous < v_threshold and v_new >= v_threshold then
    insert into public.loyalty_activity (loyalty_record_id, activity_type, amount) values (p_loyalty_record_id, 'reward_earned', null);
  end if;
  return query select record.id, record.loyalty_identifier,
    concat_ws(' ', nullif(trim(customer.first_name), ''), case when nullif(trim(customer.last_name), '') is not null then upper(left(trim(customer.last_name), 1)) || '.' else null end),
    programme.id, programme.name, programme.programme_type, programme.status,
    record.current_progress, programme.reward_threshold, programme.reward_description,
    programme.reward_value, programme.earning_rules,
    record.current_progress >= programme.reward_threshold, record.updated_at
  from public.customer_loyalty_records record
  join public.business_loyalty_programmes programme on programme.id = record.programme_id
  join public.profiles customer on customer.id = record.customer_id
  where record.id = p_loyalty_record_id;
end;
$$;

create or replace function public.redeem_loyalty_reward(p_loyalty_record_id uuid)
returns table (
  loyalty_record_id uuid, loyalty_identifier text, customer_display_name text,
  programme_id uuid, programme_name text, programme_type text,
  programme_status text, current_progress numeric, reward_threshold numeric,
  reward_description text, reward_value numeric, earning_rules text,
  reward_eligible boolean, updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_business_id uuid; v_status text; v_deadline date; v_threshold numeric; v_progress numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform public.refresh_loyalty_programme_statuses();
  select programme.business_id, programme.status, programme.early_end_completion_deadline,
    programme.reward_threshold, record.current_progress
  into v_business_id, v_status, v_deadline, v_threshold, v_progress
  from public.customer_loyalty_records record
  join public.business_loyalty_programmes programme on programme.id = record.programme_id
  where record.id = p_loyalty_record_id for update of record;
  if v_business_id is null then raise exception 'Loyalty record not found' using errcode = '42501'; end if;
  if not public.business_has_capability(v_business_id, 'loyalty') then raise exception 'Not authorized' using errcode = '42501'; end if;
  if not public.loyalty_programme_accepts_existing_activity(v_status, v_deadline) then raise exception 'Loyalty programme is not active' using errcode = '55000'; end if;
  if v_progress < v_threshold then raise exception 'Not enough progress to redeem this reward yet' using errcode = '22023'; end if;
  update public.customer_loyalty_records record
  set current_progress = record.current_progress - v_threshold,
    redemption_count = record.redemption_count + 1
  where record.id = p_loyalty_record_id;
  insert into public.loyalty_activity (loyalty_record_id, activity_type, amount) values (p_loyalty_record_id, 'reward_redeemed', null);
  return query select record.id, record.loyalty_identifier,
    concat_ws(' ', nullif(trim(customer.first_name), ''), case when nullif(trim(customer.last_name), '') is not null then upper(left(trim(customer.last_name), 1)) || '.' else null end),
    programme.id, programme.name, programme.programme_type, programme.status,
    record.current_progress, programme.reward_threshold, programme.reward_description,
    programme.reward_value, programme.earning_rules,
    record.current_progress >= programme.reward_threshold, record.updated_at
  from public.customer_loyalty_records record
  join public.business_loyalty_programmes programme on programme.id = record.programme_id
  join public.profiles customer on customer.id = record.customer_id
  where record.id = p_loyalty_record_id;
end;
$$;

revoke all on function public.delete_business_loyalty_programme_draft(uuid, uuid) from public;
revoke all on function public.cancel_business_loyalty_programme_schedule(uuid, uuid) from public;
revoke all on function public.get_business_loyalty_programme_end_summary(uuid, uuid) from public;
revoke all on function public.end_business_loyalty_programme_early(uuid, uuid) from public;
revoke all on function public.get_my_loyalty_records() from public;
revoke all on function public.create_my_loyalty_scan_code(uuid) from public;
revoke all on function public.lookup_business_loyalty_record(uuid, text) from public;
revoke all on function public.add_loyalty_progress(uuid, numeric) from public;
revoke all on function public.redeem_loyalty_reward(uuid) from public;

grant execute on function public.delete_business_loyalty_programme_draft(uuid, uuid) to authenticated;
grant execute on function public.cancel_business_loyalty_programme_schedule(uuid, uuid) to authenticated;
grant execute on function public.get_business_loyalty_programme_end_summary(uuid, uuid) to authenticated;
grant execute on function public.end_business_loyalty_programme_early(uuid, uuid) to authenticated;
grant execute on function public.get_my_loyalty_records() to authenticated;
grant execute on function public.create_my_loyalty_scan_code(uuid) to authenticated;
grant execute on function public.lookup_business_loyalty_record(uuid, text) to authenticated;
grant execute on function public.add_loyalty_progress(uuid, numeric) to authenticated;
grant execute on function public.redeem_loyalty_reward(uuid) to authenticated;

notify pgrst, 'reload schema';
