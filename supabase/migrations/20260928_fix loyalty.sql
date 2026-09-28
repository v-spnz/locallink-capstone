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
    and exists (
      select 1
      from public.business_capabilities as capability
      where capability.business_id = nearest.business_id
        and capability.loyalty_enabled
    )
  order by nearest.distance_km, nearest.business_name;
end;
$$;

revoke all on function public.discover_loyalty_programmes() from public;
grant execute on function public.discover_loyalty_programmes()
  to authenticated;