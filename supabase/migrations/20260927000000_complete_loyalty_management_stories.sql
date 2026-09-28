
create or replace function public.add_loyalty_progress(
  p_loyalty_record_id uuid,
  p_amount numeric default 1
)
returns table (
  loyalty_record_id uuid,
  loyalty_identifier text,
  customer_display_name text,
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
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_programme_status text;
  v_reward_threshold numeric;
  v_previous_progress numeric;
  v_new_progress numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Progress amount must be a positive number'
      using errcode = '22023';
  end if;

  perform public.refresh_loyalty_programme_statuses();

  select
    programme.business_id,
    programme.status,
    programme.reward_threshold,
    record.current_progress
  into
    v_business_id,
    v_programme_status,
    v_reward_threshold,
    v_previous_progress
  from public.customer_loyalty_records as record
  join public.business_loyalty_programmes as programme
    on programme.id = record.programme_id
  where record.id = p_loyalty_record_id
  for update of record;

  if v_business_id is null then
    raise exception 'Loyalty record not found' using errcode = '42501';
  end if;

  if not public.business_has_capability(v_business_id, 'loyalty') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if v_programme_status <> 'active' then
    raise exception 'Loyalty programme is not active' using errcode = '55000';
  end if;

  update public.customer_loyalty_records as record
  set current_progress = record.current_progress + p_amount
  where record.id = p_loyalty_record_id
  returning record.current_progress into v_new_progress;

  insert into public.loyalty_activity (
    loyalty_record_id,
    activity_type,
    amount
  )
  values (
    p_loyalty_record_id,
    'progress_added',
    p_amount
  );

  if v_previous_progress < v_reward_threshold
    and v_new_progress >= v_reward_threshold then
    insert into public.loyalty_activity (
      loyalty_record_id,
      activity_type,
      amount
    )
    values (
      p_loyalty_record_id,
      'reward_earned',
      null
    );
  end if;

  return query
  select
    record.id,
    record.loyalty_identifier,
    concat_ws(
      ' ',
      nullif(trim(customer.first_name), ''),
      case
        when nullif(trim(customer.last_name), '') is not null
          then upper(left(trim(customer.last_name), 1)) || '.'
        else null
      end
    ),
    programme.id,
    programme.name,
    programme.programme_type,
    programme.status,
    record.current_progress,
    programme.reward_threshold,
    programme.reward_description,
    programme.reward_value,
    programme.earning_rules,
    record.current_progress >= programme.reward_threshold,
    record.updated_at
  from public.customer_loyalty_records as record
  join public.business_loyalty_programmes as programme
    on programme.id = record.programme_id
  join public.profiles as customer
    on customer.id = record.customer_id
  where record.id = p_loyalty_record_id;
end;
$$;

create or replace function public.redeem_loyalty_reward(
  p_loyalty_record_id uuid
)
returns table (
  loyalty_record_id uuid,
  loyalty_identifier text,
  customer_display_name text,
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
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_programme_status text;
  v_reward_threshold numeric;
  v_current_progress numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  perform public.refresh_loyalty_programme_statuses();

  select
    programme.business_id,
    programme.status,
    programme.reward_threshold,
    record.current_progress
  into
    v_business_id,
    v_programme_status,
    v_reward_threshold,
    v_current_progress
  from public.customer_loyalty_records as record
  join public.business_loyalty_programmes as programme
    on programme.id = record.programme_id
  where record.id = p_loyalty_record_id
  for update of record;

  if v_business_id is null then
    raise exception 'Loyalty record not found' using errcode = '42501';
  end if;

  if not public.business_has_capability(v_business_id, 'loyalty') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if v_programme_status <> 'active' then
    raise exception 'Loyalty programme is not active' using errcode = '55000';
  end if;

  if v_current_progress < v_reward_threshold then
    raise exception 'Not enough progress to redeem this reward yet'
      using errcode = '22023';
  end if;

  update public.customer_loyalty_records as record
  set
    current_progress = record.current_progress - v_reward_threshold,
    redemption_count = record.redemption_count + 1
  where record.id = p_loyalty_record_id;

  insert into public.loyalty_activity (
    loyalty_record_id,
    activity_type,
    amount
  )
  values (
    p_loyalty_record_id,
    'reward_redeemed',
    null
  );

  return query
  select
    record.id,
    record.loyalty_identifier,
    concat_ws(
      ' ',
      nullif(trim(customer.first_name), ''),
      case
        when nullif(trim(customer.last_name), '') is not null
          then upper(left(trim(customer.last_name), 1)) || '.'
        else null
      end
    ),
    programme.id,
    programme.name,
    programme.programme_type,
    programme.status,
    record.current_progress,
    programme.reward_threshold,
    programme.reward_description,
    programme.reward_value,
    programme.earning_rules,
    record.current_progress >= programme.reward_threshold,
    record.updated_at
  from public.customer_loyalty_records as record
  join public.business_loyalty_programmes as programme
    on programme.id = record.programme_id
  join public.profiles as customer
    on customer.id = record.customer_id
  where record.id = p_loyalty_record_id;
end;
$$;

create or replace function public.get_business_loyalty_activity(
  p_business_id uuid,
  p_limit integer default 50
)
returns table (
  id bigint,
  programme_id uuid,
  programme_name text,
  programme_type text,
  activity_type text,
  customer_label text,
  amount numeric,
  occurred_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or not public.business_has_capability(p_business_id, 'loyalty') then
    raise exception 'Business loyalty access required' using errcode = '42501';
  end if;

  if p_limit is null or p_limit not between 1 and 100 then
    raise exception 'Activity limit must be between 1 and 100'
      using errcode = '22023';
  end if;

  return query
  select
    activity.id,
    programme.id,
    programme.name,
    programme.programme_type,
    activity.activity_type,
    coalesce(
      nullif(
        concat_ws(
          ' ',
          nullif(trim(customer.first_name), ''),
          case
            when nullif(trim(customer.last_name), '') is not null
              then upper(left(trim(customer.last_name), 1)) || '.'
            else null
          end
        ),
        ''
      ),
      'Customer'
    ),
    activity.amount,
    activity.created_at
  from public.loyalty_activity as activity
  join public.customer_loyalty_records as record
    on record.id = activity.loyalty_record_id
  join public.business_loyalty_programmes as programme
    on programme.id = record.programme_id
  left join public.profiles as customer
    on customer.id = record.customer_id
  where programme.business_id = p_business_id
  order by activity.created_at desc, activity.id desc
  limit p_limit;
end;
$$;

revoke all on function public.add_loyalty_progress(uuid, numeric) from public;
revoke all on function public.redeem_loyalty_reward(uuid) from public;
revoke all on function public.get_business_loyalty_activity(uuid, integer)
  from public;

grant execute on function public.add_loyalty_progress(uuid, numeric)
  to authenticated;
grant execute on function public.redeem_loyalty_reward(uuid)
  to authenticated;
grant execute on function public.get_business_loyalty_activity(uuid, integer)
  to authenticated;

comment on function public.get_business_loyalty_activity(uuid, integer) is
  'Returns recent loyalty progress, reward-earned, and redemption events for one authorised loyalty business.';

notify pgrst, 'reload schema';
