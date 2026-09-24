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
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Stamp amount must be a positive number'
      using errcode = '22023';
  end if;


  select programme.business_id
  into v_business_id
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

  update public.customer_loyalty_records as record
  set current_progress = record.current_progress + p_amount
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

revoke all on function public.add_loyalty_progress(uuid, numeric) from public;
grant execute on function public.add_loyalty_progress(uuid, numeric)
  to authenticated;




alter table public.business_loyalty_programmes
  add column join_code text;

create or replace function public.validate_published_loyalty_programme()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_local_today date := (now() at time zone 'Pacific/Auckland')::date;
begin
  if new.status = 'draft' then
    new.published_at := null;
    return new;
  end if;

  if new.status not in ('published', 'scheduled', 'active', 'expired') then
    raise exception 'Invalid loyalty programme status' using errcode = '23514';
  end if;

  if new.name is null
    or char_length(trim(new.name)) not between 3 and 120
    or new.programme_type not in ('stamp', 'points')
    or new.reward_description is null
    or char_length(trim(new.reward_description)) not between 3 and 240
    or new.reward_threshold is null
    or new.reward_threshold not between 1 and 1000000
    or new.earning_rules is null
    or char_length(trim(new.earning_rules)) not between 3 and 500
    or new.start_date is null
    or (
      new.status <> 'expired'
      and new.end_date is not null
      and new.end_date < v_local_today
    )
  then
    raise exception 'Complete every required loyalty programme field before publishing'
      using errcode = '23514';
  end if;

  new.published_at := coalesce(new.published_at, now());

  if new.join_code is null then
    new.join_code := 'LJ-'
      || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4))
      || '-'
      || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4));
  end if;

  if new.status = 'published' then
    new.status := case
      when new.start_date > v_local_today then 'scheduled'
      else 'active'
    end;
  end if;

  return new;
end;
$$;

alter table public.business_loyalty_programmes
  add constraint business_loyalty_programmes_join_code_unique unique (join_code);

create or replace function public.join_loyalty_programme(
  p_join_code text
)
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
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_normalised_code text := upper(
    regexp_replace(coalesce(p_join_code, ''), '[^A-Za-z0-9]', '', 'g')
  );
  v_programme_id uuid;
  v_record_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select programme.id
  into v_programme_id
  from public.business_loyalty_programmes as programme
  where upper(replace(programme.join_code, '-', '')) = v_normalised_code
    and programme.status = 'active';

  if v_programme_id is null then
    raise exception 'No active loyalty programme matches this code'
      using errcode = '22023';
  end if;

  insert into public.customer_loyalty_records (programme_id, customer_id)
  values (v_programme_id, v_user_id)
  on conflict (programme_id, customer_id) do nothing
  returning id into v_record_id;

  if v_record_id is null then
    select record.id
    into v_record_id
    from public.customer_loyalty_records as record
    where record.programme_id = v_programme_id
      and record.customer_id = v_user_id;
  end if;

  return query
  select
    record.id,
    record.loyalty_identifier,
    business.business_name,
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
  join public.businesses as business
    on business.id = programme.business_id
  where record.id = v_record_id;
end;
$$;

revoke all on function public.join_loyalty_programme(text) from public;
grant execute on function public.join_loyalty_programme(text) to authenticated;




create or replace function public.discover_loyalty_programmes()
returns table (
  business_id uuid,
  business_name text,
  formatted_address text,
  distance_km double precision,
  programme_id uuid,
  programme_name text,
  programme_type text,
  reward_description text,
  reward_threshold numeric,
  earning_rules text,
  join_code text,
  loyalty_record_id uuid,
  current_progress numeric,
  is_joined boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return query
  with search_origin as (
    select profile.location as point, trim(profile.suburb) as suburb
    from public.profiles as profile
    where profile.id = v_user_id
      and profile.location is not null
      and nullif(trim(profile.suburb), '') is not null
  ),
  nearest_locations as (
    select
      business.id as business_id,
      business.business_name,
      location.formatted_address,
      extensions.st_distance(location.location, origin.point) / 1000.0
        as distance_km,
      row_number() over (
        partition by business.id
        order by location.location operator(extensions.<->) origin.point
      ) as proximity_rank
    from public.business_locations as location
    join public.businesses as business on business.id = location.business_id
    cross join search_origin as origin
    where location.location is not null
      and lower(trim(location.suburb)) = lower(origin.suburb)
  )
  select
    nearest.business_id,
    nearest.business_name,
    nearest.formatted_address,
    nearest.distance_km,
    programme.id,
    programme.name,
    programme.programme_type,
    programme.reward_description,
    programme.reward_threshold,
    programme.earning_rules,
    programme.join_code,
    record.id,
    record.current_progress,
    (record.id is not null)
  from nearest_locations as nearest
  join public.business_loyalty_programmes as programme
    on programme.business_id = nearest.business_id
    and programme.status = 'active'
  left join public.customer_loyalty_records as record
    on record.programme_id = programme.id
    and record.customer_id = v_user_id
  where nearest.proximity_rank = 1
    and public.business_has_capability(nearest.business_id, 'loyalty')
  order by nearest.distance_km, nearest.business_name;
end;
$$;

revoke all on function public.discover_loyalty_programmes() from public;
grant execute on function public.discover_loyalty_programmes()
  to authenticated;





alter table public.business_loyalty_programmes
  drop constraint if exists business_loyalty_programmes_programme_type_check;

alter table public.business_loyalty_programmes
  add constraint business_loyalty_programmes_programme_type_check check (
    programme_type is null
    or programme_type in ('stamp_card', 'spend_and_save', 'spend_and_reward')
  );

create or replace function public.validate_published_loyalty_programme()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_local_today date := (now() at time zone 'Pacific/Auckland')::date;
begin
  if new.status = 'draft' then
    new.published_at := null;
    return new;
  end if;

  if new.status not in ('published', 'scheduled', 'active', 'expired') then
    raise exception 'Invalid loyalty programme status' using errcode = '23514';
  end if;

  if new.name is null
    or char_length(trim(new.name)) not between 3 and 120
    or new.programme_type not in (
      'stamp_card', 'spend_and_save', 'spend_and_reward'
    )
    or new.reward_description is null
    or char_length(trim(new.reward_description)) not between 3 and 240
    or new.reward_threshold is null
    or new.reward_threshold not between 1 and 1000000
    or new.earning_rules is null
    or char_length(trim(new.earning_rules)) not between 3 and 500
    or new.start_date is null
    or (
      new.status <> 'expired'
      and new.end_date is not null
      and new.end_date < v_local_today
    )
  then
    raise exception 'Complete every required loyalty programme field before publishing'
      using errcode = '23514';
  end if;

  new.published_at := coalesce(new.published_at, now());

  if new.join_code is null then
    new.join_code := 'LJ-'
      || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4))
      || '-'
      || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4));
  end if;

  if new.status = 'published' then
    new.status := case
      when new.start_date > v_local_today then 'scheduled'
      else 'active'
    end;
  end if;

  return new;
end;
$$;




drop function if exists public.discover_loyalty_programmes();

create function public.discover_loyalty_programmes()
returns table (
  business_id uuid,
  business_name text,
  formatted_address text,
  distance_km double precision,
  programme_id uuid,
  programme_name text,
  programme_type text,
  reward_description text,
  reward_threshold numeric,
  earning_rules text,
  loyalty_record_id uuid,
  current_progress numeric,
  is_joined boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return query
  with search_origin as (
    select profile.location as point, trim(profile.suburb) as suburb
    from public.profiles as profile
    where profile.id = v_user_id
      and profile.location is not null
      and nullif(trim(profile.suburb), '') is not null
  ),
  nearest_locations as (
    select
      business.id as business_id,
      business.business_name,
      location.formatted_address,
      extensions.st_distance(location.location, origin.point) / 1000.0
        as distance_km,
      row_number() over (
        partition by business.id
        order by location.location operator(extensions.<->) origin.point
      ) as proximity_rank
    from public.business_locations as location
    join public.businesses as business on business.id = location.business_id
    cross join search_origin as origin
    where location.location is not null
      and lower(trim(location.suburb)) = lower(origin.suburb)
  )
  select
    nearest.business_id,
    nearest.business_name,
    nearest.formatted_address,
    nearest.distance_km,
    programme.id,
    programme.name,
    programme.programme_type,
    programme.reward_description,
    programme.reward_threshold,
    programme.earning_rules,
    record.id,
    record.current_progress,
    (record.id is not null)
  from nearest_locations as nearest
  join public.business_loyalty_programmes as programme
    on programme.business_id = nearest.business_id
    and programme.status = 'active'
  left join public.customer_loyalty_records as record
    on record.programme_id = programme.id
    and record.customer_id = v_user_id
  where nearest.proximity_rank = 1
    and public.business_has_capability(nearest.business_id, 'loyalty')
  order by nearest.distance_km, nearest.business_name;
end;
$$;

revoke all on function public.discover_loyalty_programmes() from public;
grant execute on function public.discover_loyalty_programmes()
  to authenticated;
  