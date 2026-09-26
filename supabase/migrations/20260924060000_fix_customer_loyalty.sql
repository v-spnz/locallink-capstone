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
    or (
      new.programme_type = 'spend_and_reward'
      and (
        new.reward_description is null
        or char_length(trim(new.reward_description)) not between 3 and 240
      )
    )
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

  if new.name is null or char_length(trim(new.name)) not between 3 and 120
  then
    raise exception 'Programme name must be 3-120 characters (got: %)',
      coalesce(new.name, '<null>')
      using errcode = '23514';
  end if;

  if new.programme_type not in (
    'stamp_card', 'spend_and_save', 'spend_and_reward'
  ) then
    raise exception 'Invalid programme_type: %', coalesce(new.programme_type, '<null>')
      using errcode = '23514';
  end if;

  if new.programme_type = 'spend_and_reward'
    and (
      new.reward_description is null
      or char_length(trim(new.reward_description)) not between 3 and 240
    )
  then
    raise exception 'reward_description must be 3-240 characters for spend_and_reward (got: %)',
      coalesce(new.reward_description, '<null>')
      using errcode = '23514';
  end if;

  if new.reward_threshold is null
    or new.reward_threshold not between 1 and 1000000
  then
    raise exception 'reward_threshold must be between 1 and 1,000,000 (got: %)',
      coalesce(new.reward_threshold::text, '<null>')
      using errcode = '23514';
  end if;

  if new.earning_rules is null
    or char_length(trim(new.earning_rules)) not between 3 and 500
  then
    raise exception 'earning_rules must be 3-500 characters (got: % chars, value: %)',
      coalesce(char_length(trim(new.earning_rules))::text, '<null>'),
      coalesce(new.earning_rules, '<null>')
      using errcode = '23514';
  end if;

  if new.start_date is null then
    raise exception 'start_date is required' using errcode = '23514';
  end if;

  if new.status <> 'expired'
    and new.end_date is not null
    and new.end_date < v_local_today
  then
    raise exception 'end_date (%) cannot be in the past (today: %)',
      new.end_date, v_local_today
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
    v_threshold_label := trim(
      trailing '.' from trim(trailing '0' from new.reward_threshold::text)
    );
  end if;

  if new.reward_value is not null then
    v_reward_value_label := trim(
      trailing '.' from trim(trailing '0' from new.reward_value::text)
    );
  end if;

  if new.programme_type = 'stamp_card' then
    new.reward_value := null;
    new.reward_description := 'Next purchase or visit free';
    new.earning_rules := case
      when v_threshold_label is not null then format(
        'Complete %s purchases or visits to receive the next one free.',
        v_threshold_label
      )
      else null
    end;
  elsif new.programme_type = 'spend_and_save' then
    new.reward_description := case
      when v_reward_value_label is not null
        then format('$%s off', v_reward_value_label)
      else null
    end;
    new.earning_rules := case
      when v_threshold_label is not null and v_reward_value_label is not null
        then format(
          'Spend $%s to receive $%s off.',
          v_threshold_label,
          v_reward_value_label
        )
      else null
    end;
  elsif new.programme_type = 'spend_and_reward' then
    new.reward_value := null;
    new.reward_description := nullif(trim(new.reward_description), '');
    new.earning_rules := case
      when v_threshold_label is not null and new.reward_description is not null
        then format(
          'Spend $%s to receive a free %s.',
          v_threshold_label,
          new.reward_description
        )
      else null
    end;
  else
    new.earning_rules := null;
  end if;

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
      'stamp_card',
      'spend_and_save',
      'spend_and_reward'
    )
    or new.reward_threshold is null
    or new.reward_threshold not between 1 and 1000000
    or (
      new.programme_type = 'stamp_card'
      and new.reward_threshold <> trunc(new.reward_threshold)
    )
    or (
      new.programme_type = 'spend_and_save'
      and (
        new.reward_value is null
        or new.reward_value > new.reward_threshold
      )
    )
    or (
      new.programme_type = 'spend_and_reward'
      and (
        new.reward_description is null
        or char_length(new.reward_description) not between 3 and 240
      )
    )
    or new.earning_rules is null
    or char_length(new.earning_rules) not between 10 and 500
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