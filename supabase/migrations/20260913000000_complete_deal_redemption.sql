-- US0097: validate short-lived deal claim codes and redeem each claim once.

alter table public.business_deal_claims
  add column redemption_code text;

update public.business_deal_claims
set redemption_code = upper(substr(md5(id::text), 1, 12));

alter table public.business_deal_claims
  alter column redemption_code set default
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  alter column redemption_code set not null;

alter table public.business_deal_claims
  add constraint business_deal_claims_redemption_code_key
  unique (redemption_code);

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
  v_claim record;
  v_existing_redemption_id uuid;
  v_redemption public.business_deal_redemptions;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select
    claim.id,
    claim.expires_at,
    deal.business_id
  into v_claim
  from public.business_deal_claims as claim
  join public.business_deals as deal on deal.id = claim.deal_id
  where claim.id = p_claim_id
  for update of claim;

  if not found then
    raise exception 'Claim not found' using errcode = 'P0002';
  end if;

  if not public.is_business_member(v_claim.business_id) then
    raise exception 'Business membership required' using errcode = '42501';
  end if;

  select redemption.id
  into v_existing_redemption_id
  from public.business_deal_redemptions as redemption
  where redemption.claim_id = v_claim.id;

  if found then
    raise exception 'This claim has already been redeemed'
      using errcode = '55000';
  end if;

  if now() > v_claim.expires_at then
    raise exception 'This claim''s redemption window has expired'
      using errcode = '55000';
  end if;

  insert into public.business_deal_redemptions (claim_id, redeemed_by)
  values (v_claim.id, v_user_id)
  returning * into v_redemption;

  return v_redemption;
end;
$$;

create or replace function public.validate_business_deal_redemption_code(
  p_redemption_code text
)
returns table (
  claim_id uuid,
  redemption_code text,
  deal_id uuid,
  deal_title text,
  deal_status text,
  customer_name text,
  claimed_at timestamptz,
  expires_at timestamptz,
  redeemed_at timestamptz,
  offer_type text,
  discount_percentage numeric,
  discount_amount_cents integer,
  original_price_cents integer,
  deal_price_cents integer,
  offer_details text,
  redemption_instructions text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_normalized_code text;
  v_claim record;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  v_normalized_code := upper(
    regexp_replace(coalesce(p_redemption_code, ''), '[^[:alnum:]]', '', 'g')
  );

  select
    claim.id as claim_id,
    claim.redemption_code,
    claim.claimed_at,
    claim.expires_at,
    deal.id as deal_id,
    deal.business_id,
    deal.title as deal_title,
    deal.status as deal_status,
    deal.offer_type,
    deal.discount_percentage,
    deal.discount_amount_cents,
    deal.original_price_cents,
    deal.deal_price_cents,
    deal.offer_details,
    deal.redemption_instructions,
    redemption.redeemed_at,
    coalesce(
      nullif(
        trim(concat_ws(' ', customer.first_name, customer.last_name)),
        ''
      ),
      'LocalLink customer'
    ) as customer_name
  into v_claim
  from public.business_deal_claims as claim
  join public.business_deals as deal on deal.id = claim.deal_id
  left join public.profiles as customer on customer.id = claim.customer_id
  left join public.business_deal_redemptions as redemption
    on redemption.claim_id = claim.id
  where claim.redemption_code = v_normalized_code;

  if not found then
    raise exception 'Redemption code not found' using errcode = 'P0002';
  end if;

  if not public.is_business_member(v_claim.business_id) then
    raise exception 'This code belongs to another business'
      using errcode = '42501';
  end if;

  if v_claim.redeemed_at is not null then
    raise exception 'This claim has already been redeemed'
      using errcode = '55000';
  end if;

  if now() > v_claim.expires_at then
    raise exception 'This claim''s redemption window has expired'
      using errcode = '55000';
  end if;

  return query
  select
    v_claim.claim_id,
    v_claim.redemption_code,
    v_claim.deal_id,
    v_claim.deal_title,
    v_claim.deal_status,
    v_claim.customer_name,
    v_claim.claimed_at,
    v_claim.expires_at,
    v_claim.redeemed_at,
    v_claim.offer_type,
    v_claim.discount_percentage,
    v_claim.discount_amount_cents,
    v_claim.original_price_cents,
    v_claim.deal_price_cents,
    v_claim.offer_details,
    v_claim.redemption_instructions;
end;
$$;

create or replace function public.redeem_business_deal_claim_by_code(
  p_redemption_code text
)
returns table (
  redemption_id uuid,
  claim_id uuid,
  redeemed_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_normalized_code text;
  v_claim_id uuid;
  v_business_id uuid;
  v_redemption public.business_deal_redemptions;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  v_normalized_code := upper(
    regexp_replace(coalesce(p_redemption_code, ''), '[^[:alnum:]]', '', 'g')
  );

  select claim.id, deal.business_id
  into v_claim_id, v_business_id
  from public.business_deal_claims as claim
  join public.business_deals as deal on deal.id = claim.deal_id
  where claim.redemption_code = v_normalized_code;

  if not found then
    raise exception 'Redemption code not found' using errcode = 'P0002';
  end if;

  if not public.is_business_member(v_business_id) then
    raise exception 'This code belongs to another business'
      using errcode = '42501';
  end if;

  v_redemption := public.redeem_business_deal_claim(v_claim_id);

  return query
  select v_redemption.id, v_redemption.claim_id, v_redemption.redeemed_at;
end;
$$;

create or replace function public.get_business_deal_redemptions(
  p_business_id uuid
)
returns table (
  redemption_id uuid,
  claim_id uuid,
  redemption_code text,
  deal_id uuid,
  deal_title text,
  customer_name text,
  claimed_at timestamptz,
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_business_member(p_business_id) then
    raise exception 'Business membership required' using errcode = '42501';
  end if;

  return query
  select
    redemption.id,
    claim.id,
    claim.redemption_code,
    deal.id,
    deal.title,
    coalesce(
      nullif(
        trim(concat_ws(' ', customer.first_name, customer.last_name)),
        ''
      ),
      'LocalLink customer'
    ),
    claim.claimed_at,
    claim.expires_at,
    redemption.redeemed_at,
    coalesce(
      nullif(
        trim(concat_ws(' ', redeemer.first_name, redeemer.last_name)),
        ''
      ),
      'Business member'
    )
  from public.business_deal_redemptions as redemption
  join public.business_deal_claims as claim on claim.id = redemption.claim_id
  join public.business_deals as deal on deal.id = claim.deal_id
  left join public.profiles as customer on customer.id = claim.customer_id
  left join public.profiles as redeemer on redeemer.id = redemption.redeemed_by
  where deal.business_id = p_business_id
  order by redemption.redeemed_at desc;
end;
$$;

drop function if exists public.get_my_business_deal_claims();

create function public.get_my_business_deal_claims()
returns table (
  claim_id uuid,
  redemption_code text,
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
    claim.redemption_code,
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

revoke all on function public.validate_business_deal_redemption_code(text)
  from public;
revoke all on function public.redeem_business_deal_claim_by_code(text)
  from public;
revoke all on function public.get_business_deal_redemptions(uuid)
  from public;
revoke all on function public.get_my_business_deal_claims()
  from public;

grant execute on function public.validate_business_deal_redemption_code(text)
  to authenticated;
grant execute on function public.redeem_business_deal_claim_by_code(text)
  to authenticated;
grant execute on function public.get_business_deal_redemptions(uuid)
  to authenticated;
grant execute on function public.get_my_business_deal_claims()
  to authenticated;

notify pgrst, 'reload schema';
