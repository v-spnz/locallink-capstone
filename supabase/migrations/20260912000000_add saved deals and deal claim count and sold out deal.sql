create or replace function public.get_my_saved_deals()
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
  deal_image_url text,
  saved_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_origin extensions.geography;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select profile.location
  into v_origin
  from public.profiles as profile
  where profile.id = v_user_id;

  return query
  select
    business.id as business_id,
    location.id as location_id,
    business.business_name,
    business.description,
    deal.category,
    location.formatted_address,
    extensions.st_y(location.location::extensions.geometry) as latitude,
    extensions.st_x(location.location::extensions.geometry) as longitude,
    case
      when v_origin is not null and location.location is not null
        then extensions.st_distance(location.location, v_origin) / 1000.0
      else null
    end as distance_km,
    deal.id as deal_id,
    deal.title as deal_title,
    deal.description as deal_description,
    deal.image_url as deal_image_url,
    saved.created_at as saved_at
  from public.saved_deals as saved
  join public.business_deals as deal on deal.id = saved.deal_id
  join public.businesses as business on business.id = deal.business_id
  left join lateral (
    select
      business_location.id,
      business_location.formatted_address,
      business_location.location
    from public.business_deal_locations as deal_location
    join public.business_locations as business_location
      on business_location.id = deal_location.location_id
    where deal_location.deal_id = deal.id
    order by business_location.is_primary desc, business_location.created_at
    limit 1
  ) as location on true
  where saved.customer_id = v_user_id
    and public.is_business_deal_active(
      deal.status, deal.start_date, deal.end_date, v_now
    )
  order by saved.created_at desc;
end;
$$;

revoke all on function public.get_my_saved_deals() from public;
grant execute on function public.get_my_saved_deals() to authenticated;

notify pgrst, 'reload schema';

grant select, insert, delete on public.saved_deals to authenticated;

create or replace function public.get_business_deal_claim_count(
  p_deal_id uuid
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.business_deal_claims
  where deal_id = p_deal_id;
$$;

revoke all on function public.get_business_deal_claim_count(uuid) from public;
grant execute on function public.get_business_deal_claim_count(uuid)
  to authenticated;


create or replace function public.enforce_saved_deal_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_count integer;
begin
  select count(*)
  into v_existing_count
  from public.saved_deals
  where customer_id = new.customer_id;

  if v_existing_count >= 3 then
    raise exception 'You can only save up to 3 deals at a time. Remove one to save another.'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

drop trigger if exists saved_deals_enforce_limit on public.saved_deals;
create trigger saved_deals_enforce_limit
  before insert on public.saved_deals
  for each row execute function public.enforce_saved_deal_limit();



drop function if exists public.businesses_in_my_suburb(text);

create function public.businesses_in_my_suburb(
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
  deal_image_url text,
  deal_claim_limit integer,
  deal_is_sold_out boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
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
      location.id as location_id,
      business.business_name,
      business.description,
      location.formatted_address,
      extensions.st_y(location.location::extensions.geometry) as latitude,
      extensions.st_x(location.location::extensions.geometry) as longitude,
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
  ),
  candidates as (
    select
      nearest.business_id,
      nearest.location_id,
      nearest.business_name,
      nearest.description,
      coalesce(deal.category, case
        when capability.service_marketplace_enabled then 'Trades'
        else 'Services'
      end) as category,
      nearest.formatted_address,
      nearest.latitude,
      nearest.longitude,
      nearest.distance_km,
      deal.id as deal_id,
      deal.title as deal_title,
      deal.description as deal_description,
      deal.image_url as deal_image_url,
      deal.claim_limit as deal_claim_limit,
      (
        deal.claim_limit is not null
        and deal.claims_used >= deal.claim_limit
      ) as deal_is_sold_out,
      deal.published_at
    from nearest_locations as nearest
    join public.business_capabilities as capability
      on capability.business_id = nearest.business_id
    left join lateral (
      select
        published_deal.id,
        published_deal.title,
        published_deal.description,
        published_deal.category,
        published_deal.image_url,
        published_deal.claim_limit,
        published_deal.published_at,
        (
          select count(*)
          from public.business_deal_claims as claim
          where claim.deal_id = published_deal.id
        ) as claims_used
      from public.business_deal_locations as deal_location
      join public.business_deals as published_deal
        on published_deal.id = deal_location.deal_id
      where deal_location.location_id = nearest.location_id
        and public.is_business_deal_active(
          published_deal.status,
          published_deal.start_date,
          published_deal.end_date,
          v_now
        )
      order by published_deal.published_at desc
      limit 3
    ) as deal on true
    where nearest.proximity_rank = 1
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
    candidate.deal_image_url,
    candidate.deal_claim_limit,
    candidate.deal_is_sold_out
  from candidates as candidate
  where (
    p_category is null
    or p_category = 'All'
    or candidate.category = p_category
  )
  order by
    candidate.distance_km,
    candidate.business_name,
    candidate.published_at desc nulls last;
end;
$$;

revoke all on function public.businesses_in_my_suburb(text) from public;
grant execute on function public.businesses_in_my_suburb(text) to authenticated;

notify pgrst, 'reload schema';