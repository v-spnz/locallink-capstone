alter table public.business_deal_claims
  add column expires_at timestamptz;

update public.business_deal_claims
set expires_at = claimed_at + interval '15 minutes'
where expires_at is null;

alter table public.business_deal_claims
  alter column expires_at set not null;

create or replace function public.claim_business_deal(
  p_deal_id uuid
)
returns public.business_deal_claims
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_local_today date;
  v_deal public.business_deals;
  v_claim public.business_deal_claims;
  v_claim_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  v_local_today := (v_now at time zone 'Pacific/Auckland')::date;
  perform public.refresh_business_deal_statuses(v_local_today);

  select deal.*
  into v_deal
  from public.business_deals as deal
  where deal.id = p_deal_id
  for update;

  if not found
    or not public.is_business_deal_active(
      v_deal.status,
      v_deal.start_date,
      v_deal.end_date,
      v_now
    )
  then
    raise exception 'Deal is not active' using errcode = '55000';
  end if;

  select claim.*
  into v_claim
  from public.business_deal_claims as claim
  where claim.deal_id = p_deal_id
    and claim.customer_id = v_user_id;

  if found then
    return v_claim;
  end if;

  select count(*)::integer
  into v_claim_count
  from public.business_deal_claims
  where deal_id = p_deal_id;

  if v_claim_count >= v_deal.claim_limit then
    raise exception 'This deal has reached its claim limit' using errcode = '55000';
  end if;

  insert into public.business_deal_claims (
    deal_id, customer_id, claimed_at, expires_at
  )
  values (
    p_deal_id, v_user_id, v_now, v_now + interval '15 minutes'
  )
  returning * into v_claim;

  return v_claim;
end;
$$;

create or replace function public.redeem_business_deal_claim(
  p_claim_id uuid
)
returns public.business_deal_redemptions
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_claim public.business_deal_claims;
  v_redemption public.business_deal_redemptions;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select claim.*
  into v_claim
  from public.business_deal_claims as claim
  join public.business_deals as deal on deal.id = claim.deal_id
  where claim.id = p_claim_id
    and public.is_business_member(deal.business_id);

  if not found then
    raise exception 'Business membership required' using errcode = '42501';
  end if;

  if now() > v_claim.expires_at then
    raise exception 'This claim''s 15-minute redemption window has expired'
      using errcode = '55000';
  end if;

  insert into public.business_deal_redemptions (claim_id, redeemed_by)
  values (p_claim_id, v_user_id)
  on conflict (claim_id) do nothing
  returning * into v_redemption;

  if v_redemption.id is null then
    select redemption.*
    into v_redemption
    from public.business_deal_redemptions as redemption
    where redemption.claim_id = p_claim_id;
  end if;

  return v_redemption;
end;
$$;

drop function if exists public.get_my_business_deal_claims();

create function public.get_my_business_deal_claims()
returns table (
  claim_id uuid,
  deal_id uuid,
  claimed_at timestamptz,
  expires_at timestamptz,
  redeemed_at timestamptz,
  ended_at timestamptz,
  status text,
  title text,
  description text,
  category text,
  image_url text,
  offer_type text,
  discount_percentage numeric,
  discount_amount_cents integer,
  original_price_cents integer,
  deal_price_cents integer,
  offer_details text,
  start_date date,
  end_date date,
  conditions text,
  claim_limit integer,
  exclusions text,
  redemption_instructions text,
  business_name text,
  formatted_address text,
  suburb text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
begin
  if v_customer_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return query
  select
    claim.id,
    deal.id,
    claim.claimed_at,
    claim.expires_at,
    redemption.redeemed_at,
    deal.ended_at,
    deal.status,
    deal.title,
    deal.description,
    deal.category,
    deal.image_url,
    deal.offer_type,
    deal.discount_percentage,
    deal.discount_amount_cents,
    deal.original_price_cents,
    deal.deal_price_cents,
    deal.offer_details,
    deal.start_date,
    deal.end_date,
    deal.conditions,
    deal.claim_limit,
    deal.exclusions,
    deal.redemption_instructions,
    business.business_name,
    location.formatted_address,
    location.suburb
  from public.business_deal_claims as claim
  join public.business_deals as deal on deal.id = claim.deal_id
  join public.businesses as business on business.id = deal.business_id
  left join public.business_deal_redemptions as redemption
    on redemption.claim_id = claim.id
  left join lateral (
    select business_location.formatted_address, business_location.suburb
    from public.business_deal_locations as deal_location
    join public.business_locations as business_location
      on business_location.id = deal_location.location_id
    where deal_location.deal_id = deal.id
    order by business_location.is_primary desc, business_location.created_at
    limit 1
  ) as location on true
  where claim.customer_id = v_customer_id
  order by claim.claimed_at desc;
end;
$$;

revoke all on function public.get_my_business_deal_claims() from public;
grant execute on function public.get_my_business_deal_claims() to authenticated;

notify pgrst, 'reload schema';