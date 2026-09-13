-- Keep customer identity private in business-facing deal redemption responses.

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
        concat(
          case
            when nullif(trim(customer.first_name), '') is not null
              then upper(
                left(nullif(trim(customer.first_name), ''), 1)
              ) || '.'
            else ''
          end,
          case
            when nullif(trim(customer.last_name), '') is not null
              then upper(
                left(nullif(trim(customer.last_name), ''), 1)
              ) || '.'
            else ''
          end
        ),
        ''
      ),
      'Customer'
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
        concat(
          case
            when nullif(trim(customer.first_name), '') is not null
              then upper(
                left(nullif(trim(customer.first_name), ''), 1)
              ) || '.'
            else ''
          end,
          case
            when nullif(trim(customer.last_name), '') is not null
              then upper(
                left(nullif(trim(customer.last_name), ''), 1)
              ) || '.'
            else ''
          end
        ),
        ''
      ),
      'Customer'
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

revoke all on function public.validate_business_deal_redemption_code(text)
  from public;
revoke all on function public.get_business_deal_redemptions(uuid)
  from public;

grant execute on function public.validate_business_deal_redemption_code(text)
  to authenticated;
grant execute on function public.get_business_deal_redemptions(uuid)
  to authenticated;

notify pgrst, 'reload schema';
