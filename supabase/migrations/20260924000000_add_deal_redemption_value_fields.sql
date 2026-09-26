-- Record optional sales value and customer savings when a deal is redeemed.
-- Historical redemptions remain valid and unknown values remain null.

alter table public.business_deal_redemptions
  add column transaction_amount_cents integer,
  add column savings_amount_cents integer,
  add constraint business_deal_redemptions_transaction_amount_check check (
    transaction_amount_cents is null
    or transaction_amount_cents between 0 and 100000000
  ),
  add constraint business_deal_redemptions_savings_amount_check check (
    savings_amount_cents is null
    or savings_amount_cents between 0 and 100000000
  );

create index business_deal_redemptions_redeemed_at_idx
  on public.business_deal_redemptions (redeemed_at, claim_id);

comment on column public.business_deal_redemptions.transaction_amount_cents is
  'Optional transaction or sales value recorded at deal redemption. This is not profit or ROI.';

comment on column public.business_deal_redemptions.savings_amount_cents is
  'Optional customer savings recorded at deal redemption.';

drop function if exists public.redeem_business_deal_claim(uuid);

create function public.redeem_business_deal_claim(
  p_claim_id uuid,
  p_transaction_amount_cents integer default null,
  p_savings_amount_cents integer default null
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

  if p_transaction_amount_cents is not null
    and p_transaction_amount_cents not between 0 and 100000000 then
    raise exception 'Enter a valid transaction amount' using errcode = '22023';
  end if;

  if p_savings_amount_cents is not null
    and p_savings_amount_cents not between 0 and 100000000 then
    raise exception 'Enter a valid customer savings amount' using errcode = '22023';
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

  insert into public.business_deal_redemptions (
    claim_id,
    redeemed_by,
    transaction_amount_cents,
    savings_amount_cents
  )
  values (
    v_claim.id,
    v_user_id,
    p_transaction_amount_cents,
    p_savings_amount_cents
  )
  returning * into v_redemption;

  return v_redemption;
end;
$$;

drop function if exists public.redeem_business_deal_claim_by_code(text);

create function public.redeem_business_deal_claim_by_code(
  p_redemption_code text,
  p_transaction_amount_cents integer default null,
  p_savings_amount_cents integer default null
)
returns table (
  redeemed_at timestamptz,
  transaction_amount_cents integer,
  savings_amount_cents integer
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

  v_redemption := public.redeem_business_deal_claim(
    v_claim_id,
    p_transaction_amount_cents,
    p_savings_amount_cents
  );

  return query
  select
    v_redemption.redeemed_at,
    v_redemption.transaction_amount_cents,
    v_redemption.savings_amount_cents;
end;
$$;

drop function if exists public.get_business_deal_redemptions(uuid);

create function public.get_business_deal_redemptions(
  p_business_id uuid
)
returns table (
  claim_reference text,
  deal_id uuid,
  deal_title text,
  customer_name text,
  claimed_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by_name text,
  transaction_amount_cents integer,
  savings_amount_cents integer
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
    claim.claim_reference,
    deal.id,
    deal.title,
    coalesce(
      nullif(
        concat_ws(
          ' ',
          nullif(trim(customer.first_name), ''),
          case
            when nullif(trim(customer.last_name), '') is not null
              then upper(left(trim(customer.last_name), 1)) || '.'
            else null
          end
        ),
        ''
      ),
      'Customer'
    ),
    claim.claimed_at,
    redemption.redeemed_at,
    coalesce(
      nullif(
        trim(concat_ws(' ', redeemer.first_name, redeemer.last_name)),
        ''
      ),
      'Business member'
    ),
    redemption.transaction_amount_cents,
    redemption.savings_amount_cents
  from public.business_deal_redemptions as redemption
  join public.business_deal_claims as claim on claim.id = redemption.claim_id
  join public.business_deals as deal on deal.id = claim.deal_id
  left join public.profiles as customer on customer.id = claim.customer_id
  left join public.profiles as redeemer on redeemer.id = redemption.redeemed_by
  where deal.business_id = p_business_id
  order by redemption.redeemed_at desc;
end;
$$;

revoke all on function public.redeem_business_deal_claim(
  uuid,
  integer,
  integer
) from public;
revoke all on function public.redeem_business_deal_claim_by_code(
  text,
  integer,
  integer
) from public;
revoke all on function public.get_business_deal_redemptions(uuid) from public;

grant execute on function public.redeem_business_deal_claim(
  uuid,
  integer,
  integer
) to authenticated;
grant execute on function public.redeem_business_deal_claim_by_code(
  text,
  integer,
  integer
) to authenticated;
grant execute on function public.get_business_deal_redemptions(uuid)
  to authenticated;

notify pgrst, 'reload schema';
