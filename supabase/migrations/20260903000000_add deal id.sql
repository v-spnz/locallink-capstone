drop function if exists public.businesses_in_my_suburb(text);
 
create or replace function public.businesses_in_my_suburb(
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
  deal_id uuid,
  deal_title text,
  deal_description text,
  deal_image_url text
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
      deal.id as deal_id,
      deal.title as deal_title,
      deal.description as deal_description,
      deal.image_url as deal_image_url,
      row_number() over (
        partition by business.id
        order by location.location operator(extensions.<->) origin.point
      ) as proximity_rank
    from public.business_locations as location
    join public.businesses as business on business.id = location.business_id
    join public.business_capabilities as capability
      on capability.business_id = business.id
    cross join search_origin as origin
    left join lateral (
      select
        published_deal.id,
        published_deal.title,
        published_deal.description,
        published_deal.category,
        published_deal.image_url
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
      and lower(trim(location.suburb)) = lower(origin.suburb)
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
    candidate.deal_id,
    candidate.deal_title,
    candidate.deal_description,
    candidate.deal_image_url
  from candidates as candidate
  where candidate.proximity_rank = 1
    and (
      p_category is null
      or p_category = 'All'
      or candidate.category = p_category
    )
  order by candidate.distance_km, candidate.business_name;
end;
$$;
 
revoke all on function public.businesses_in_my_suburb(text) from public;
grant execute on function public.businesses_in_my_suburb(text) to authenticated;


