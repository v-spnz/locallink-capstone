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