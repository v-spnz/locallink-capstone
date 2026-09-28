
create extension if not exists postgis with schema extensions;

alter table public.profiles
  add column if not exists formatted_address text,
  add column if not exists address_line1 text,
  add column if not exists suburb text,
  add column if not exists city text,
  add column if not exists postcode text,
  add column if not exists country_code text,
  add column if not exists location extensions.geography(POINT, 4326);

alter table public.business_locations
  add column if not exists formatted_address text,
  add column if not exists address_line1 text,
  add column if not exists suburb text,
  add column if not exists city text,
  add column if not exists postcode text,
  add column if not exists country_code text not null default 'nz',
  add column if not exists location extensions.geography(POINT, 4326),
  add column if not exists is_primary boolean not null default false;

create index if not exists profiles_location_gix
  on public.profiles using gist (location);
create index if not exists business_locations_location_gix
  on public.business_locations using gist (location);

drop function if exists public.create_business_with_owner(
  text, text, boolean, boolean, boolean, text, text, text[], text[], text[]
);

create or replace function public.create_business_with_owner(
  p_business_name text,
  p_description text default '',
  p_deals_enabled boolean default false,
  p_loyalty_enabled boolean default false,
  p_service_marketplace_enabled boolean default false,
  p_service_description text default null,
  p_availability text default null,
  p_categories text[] default '{}'::text[],
  p_areas text[] default '{}'::text[],
  p_locations jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_business_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_business_name, ''))) < 2 then
    raise exception 'Enter a valid business name';
  end if;

  if not (p_deals_enabled or p_loyalty_enabled or p_service_marketplace_enabled) then
    raise exception 'Select at least one LocalLink capability';
  end if;

  if p_deals_enabled
    and jsonb_array_length(coalesce(p_locations, '[]'::jsonb)) = 0
  then
    raise exception 'Enter at least one business location';
  end if;

  if p_service_marketplace_enabled and (
    char_length(trim(coalesce(p_service_description, ''))) < 10
    or char_length(trim(coalesce(p_availability, ''))) < 2
    or coalesce(array_length(p_categories, 1), 0) = 0
    or coalesce(array_length(p_areas, 1), 0) = 0
  ) then
    raise exception 'Complete all Service Marketplace details';
  end if;

  insert into public.businesses (
    business_name,
    description,
    verification_status,
    onboarding_completed_at
  )
  values (
    trim(p_business_name),
    trim(coalesce(p_description, '')),
    case when p_service_marketplace_enabled then 'pending' else 'not_required' end,
    now()
  )
  returning id into v_business_id;

  insert into public.business_members (business_id, profile_id, role)
  values (v_business_id, v_user_id, 'owner');

  insert into public.business_capabilities (
    business_id,
    deals_enabled,
    loyalty_enabled,
    service_marketplace_enabled
  )
  values (
    v_business_id,
    p_deals_enabled,
    p_loyalty_enabled,
    p_service_marketplace_enabled
  );

  insert into public.business_locations (
    business_id,
    name,
    formatted_address,
    address_line1,
    suburb,
    city,
    postcode,
    country_code,
    location,
    is_primary
  )
  select
    v_business_id,
    left(trim(coalesce(location_record.name, location_record.address_line1)), 120),
    trim(location_record.formatted_address),
    nullif(trim(location_record.address_line1), ''),
    nullif(trim(location_record.suburb), ''),
    nullif(trim(location_record.city), ''),
    nullif(trim(location_record.postcode), ''),
    lower(coalesce(nullif(trim(location_record.country_code), ''), 'nz')),
    extensions.st_setsrid(
      extensions.st_makepoint(location_record.longitude, location_record.latitude),
      4326
    )::extensions.geography,
    false
  from jsonb_to_recordset(coalesce(p_locations, '[]'::jsonb)) as location_record(
    name text,
    formatted_address text,
    address_line1 text,
    suburb text,
    city text,
    postcode text,
    country_code text,
    latitude double precision,
    longitude double precision
  )
  where char_length(trim(location_record.formatted_address)) >= 2
    and location_record.latitude between -90 and 90
    and location_record.longitude between -180 and 180
  on conflict (business_id, name) do nothing;

  update public.business_locations
  set is_primary = id = (
    select location.id
    from public.business_locations as location
    where location.business_id = v_business_id
    order by location.created_at, location.id
    limit 1
  )
  where business_id = v_business_id;

  if p_deals_enabled and not exists (
    select 1
    from public.business_locations
    where business_id = v_business_id
      and location is not null
  ) then
    raise exception 'Enter at least one valid business location';
  end if;

  if p_service_marketplace_enabled then
    insert into public.business_service_profiles (
      business_id,
      service_description,
      availability
    )
    values (
      v_business_id,
      trim(p_service_description),
      trim(p_availability)
    );

    insert into public.business_service_categories (business_id, service_category)
    select v_business_id, trim(category)
    from unnest(p_categories) as category
    where char_length(trim(category)) >= 2
    on conflict (business_id, service_category) do nothing;

    insert into public.business_service_areas (business_id, service_area)
    select v_business_id, trim(area)
    from unnest(p_areas) as area
    where char_length(trim(area)) >= 2
    on conflict (business_id, service_area) do nothing;
  end if;

  return v_business_id;
end;
$$;

revoke all on function public.create_business_with_owner(
  text, text, boolean, boolean, boolean, text, text, text[], text[], jsonb
) from public;
grant execute on function public.create_business_with_owner(
  text, text, boolean, boolean, boolean, text, text, text[], text[], jsonb
) to authenticated;

create or replace function public.set_customer_location(
  p_formatted_address text,
  p_address_line1 text,
  p_suburb text,
  p_city text,
  p_postcode text,
  p_country_code text,
  p_latitude double precision,
  p_longitude double precision
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_formatted_address, ''))) < 2
    or p_latitude not between -90 and 90
    or p_longitude not between -180 and 180
  then
    raise exception 'Select a valid address' using errcode = '22023';
  end if;

  update public.profiles
  set
    formatted_address = trim(p_formatted_address),
    address_line1 = nullif(trim(p_address_line1), ''),
    suburb = nullif(trim(p_suburb), ''),
    city = nullif(trim(p_city), ''),
    postcode = nullif(trim(p_postcode), ''),
    country_code = lower(coalesce(nullif(trim(p_country_code), ''), 'nz')),
    location = extensions.st_setsrid(
      extensions.st_makepoint(p_longitude, p_latitude),
      4326
    )::extensions.geography,
    updated_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.set_customer_location(
  text, text, text, text, text, text, double precision, double precision
) from public;
grant execute on function public.set_customer_location(
  text, text, text, text, text, text, double precision, double precision
) to authenticated;

create or replace function public.get_my_location()
returns table (
  formatted_address text,
  address_line1 text,
  suburb text,
  city text,
  postcode text,
  country_code text,
  latitude double precision,
  longitude double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.formatted_address,
    profile.address_line1,
    profile.suburb,
    profile.city,
    profile.postcode,
    profile.country_code,
    extensions.st_y(profile.location::extensions.geometry),
    extensions.st_x(profile.location::extensions.geometry)
  from public.profiles as profile
  where profile.id = auth.uid()
    and profile.location is not null;
$$;

revoke all on function public.get_my_location() from public;
grant execute on function public.get_my_location() to authenticated;

create or replace function public.add_business_location(
  p_business_id uuid,
  p_name text,
  p_formatted_address text,
  p_address_line1 text,
  p_suburb text,
  p_city text,
  p_postcode text,
  p_country_code text,
  p_latitude double precision,
  p_longitude double precision
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_location_id uuid;
begin
  if not public.can_manage_business(p_business_id) then
    raise exception 'Business manager access required' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_formatted_address, ''))) < 2
    or p_latitude not between -90 and 90
    or p_longitude not between -180 and 180
  then
    raise exception 'Select a valid address' using errcode = '22023';
  end if;

  insert into public.business_locations (
    business_id, name, formatted_address, address_line1, suburb, city,
    postcode, country_code, location, is_primary
  )
  values (
    p_business_id,
    left(trim(coalesce(nullif(p_name, ''), p_address_line1, p_formatted_address)), 120),
    trim(p_formatted_address),
    nullif(trim(p_address_line1), ''),
    nullif(trim(p_suburb), ''),
    nullif(trim(p_city), ''),
    nullif(trim(p_postcode), ''),
    lower(coalesce(nullif(trim(p_country_code), ''), 'nz')),
    extensions.st_setsrid(
      extensions.st_makepoint(p_longitude, p_latitude),
      4326
    )::extensions.geography,
    not exists (
      select 1 from public.business_locations where business_id = p_business_id
    )
  )
  on conflict (business_id, name) do update
  set
    formatted_address = excluded.formatted_address,
    address_line1 = excluded.address_line1,
    suburb = excluded.suburb,
    city = excluded.city,
    postcode = excluded.postcode,
    country_code = excluded.country_code,
    location = excluded.location
  returning id into v_location_id;

  return v_location_id;
end;
$$;

revoke all on function public.add_business_location(
  uuid, text, text, text, text, text, text, text, double precision, double precision
) from public;
grant execute on function public.add_business_location(
  uuid, text, text, text, text, text, text, text, double precision, double precision
) to authenticated;

create or replace function public.nearby_businesses(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision default 5,
  p_category text default null
)
returns table (
  business_id uuid,
  location_id uuid,
  business_name text,
  description text,
  category text,
  formatted_address text,
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  deal_title text,
  deal_description text,
  deal_image_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  with search_origin as (
    select extensions.st_setsrid(
      extensions.st_makepoint(p_longitude, p_latitude),
      4326
    )::extensions.geography as point
  ),
  candidates as (
    select
      business.id as business_id,
      location.id as location_id,
      business.business_name,
      business.description,
      coalesce(deal.category, case
        when capability.service_marketplace_enabled then 'Trades'
        else 'Services'
      end) as category,
      location.formatted_address,
      extensions.st_y(location.location::extensions.geometry) as latitude,
      extensions.st_x(location.location::extensions.geometry) as longitude,
      extensions.st_distance(location.location, origin.point) / 1000.0 as distance_km,
      deal.title as deal_title,
      deal.description as deal_description,
      deal.image_url as deal_image_url,
      row_number() over (
        partition by business.id
        order by location.location operator(extensions.<->) origin.point
      ) as proximity_rank
    from public.business_locations as location
    join public.businesses as business on business.id = location.business_id
    join public.business_capabilities as capability on capability.business_id = business.id
    cross join search_origin as origin
    left join lateral (
      select published_deal.title, published_deal.description,
        published_deal.category, published_deal.image_url
      from public.business_deal_locations as deal_location
      join public.business_deals as published_deal
        on published_deal.id = deal_location.deal_id
      where deal_location.location_id = location.id
        and published_deal.status = 'published'
        and published_deal.start_date <= current_date
        and published_deal.end_date >= current_date
      order by published_deal.published_at desc
      limit 1
    ) as deal on true
    where location.location is not null
      and extensions.st_dwithin(
        location.location,
        origin.point,
        least(greatest(p_radius_km, 1), 50) * 1000
      )
  )
  select
    candidate.business_id,
    candidate.location_id,
    candidate.business_name,
    candidate.description,
    candidate.category,
    candidate.formatted_address,
    candidate.latitude,
    candidate.longitude,
    candidate.distance_km,
    candidate.deal_title,
    candidate.deal_description,
    candidate.deal_image_url
  from candidates as candidate
  where candidate.proximity_rank = 1
    and (p_category is null or p_category = 'All' or candidate.category = p_category)
  order by candidate.distance_km, candidate.business_name;
$$;

revoke all on function public.nearby_businesses(
  double precision, double precision, double precision, text
) from public;
grant execute on function public.nearby_businesses(
  double precision, double precision, double precision, text
) to authenticated;
