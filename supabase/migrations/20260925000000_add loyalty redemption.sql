alter table public.customer_loyalty_records
  add column redemption_count integer not null default 0 check (
    redemption_count >= 0
  );

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
  v_reward_threshold numeric;
  v_current_progress numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select programme.business_id, programme.reward_threshold, record.current_progress
  into v_business_id, v_reward_threshold, v_current_progress
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

  if v_current_progress < v_reward_threshold then
    raise exception 'Not enough progress to redeem this reward yet'
      using errcode = '22023';
  end if;

  update public.customer_loyalty_records as record
  set
    current_progress = record.current_progress - v_reward_threshold,
    redemption_count = record.redemption_count + 1
  where record.id = p_loyalty_record_id;

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
    programme.status = 'active'
      and record.current_progress >= programme.reward_threshold,
    record.updated_at
  from public.customer_loyalty_records as record
  join public.business_loyalty_programmes as programme
    on programme.id = record.programme_id
  join public.profiles as customer
    on customer.id = record.customer_id
  where record.id = p_loyalty_record_id;
end;
$$;

revoke all on function public.redeem_loyalty_reward(uuid) from public;
grant execute on function public.redeem_loyalty_reward(uuid) to authenticated;