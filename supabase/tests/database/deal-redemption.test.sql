begin;

select plan(41);

select has_column(
  'public',
  'business_deal_redemptions',
  'transaction_amount_cents',
  'a redemption can record its transaction value'
);

select has_column(
  'public',
  'business_deal_redemptions',
  'savings_amount_cents',
  'a redemption can record customer savings'
);

select has_column(
  'public',
  'business_deal_claims',
  'redemption_code',
  'a claim has a staff-readable redemption code'
);

select col_not_null(
  'public',
  'business_deal_claims',
  'redemption_code',
  'every claim receives a redemption code'
);

select has_column(
  'public',
  'business_deal_claims',
  'claim_reference',
  'a claim has a human-readable reference'
);

select col_not_null(
  'public',
  'business_deal_claims',
  'claim_reference',
  'every claim receives a reference'
);

select has_function(
  'public',
  'validate_business_deal_redemption_code',
  array['text'],
  'a business can validate a code before confirming'
);

select has_function(
  'public',
  'lookup_business_deal_claim',
  array['text'],
  'a business can look up a claim by reference'
);

select has_function(
  'public',
  'redeem_business_deal_claim_by_code',
  array['text', 'integer', 'integer'],
  'a business can confirm a redemption by code'
);

select has_function(
  'public',
  'get_business_deal_redemptions',
  array['uuid'],
  'a business can retrieve its redemption records'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.business_deal_claims'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) = 'UNIQUE (redemption_code)'
  ),
  'redemption codes are unique'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.business_deal_claims'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) = 'UNIQUE (claim_reference)'
  ),
  'claim references are unique'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.business_deal_redemptions'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) = 'UNIQUE (claim_id)'
  ),
  'the database prevents simultaneous attempts from recording two redemptions'
);

insert into public.business_deals (
  id,
  business_id,
  title,
  description,
  category,
  image_url,
  offer_type,
  discount_percentage,
  gst_included,
  start_date,
  end_date,
  conditions,
  claim_limit,
  redemption_instructions,
  status
)
values (
  '27000000-0000-0000-0000-000000000098',
  '21000000-0000-0000-0000-000000000001',
  'US0097 redemption deal',
  'An active deal used to verify safe one-time redemption.',
  'Trades',
  'https://example.test/us0097.jpg',
  'percentage_discount',
  25,
  true,
  (now() at time zone 'Pacific/Auckland')::date - 1,
  (now() at time zone 'Pacific/Auckland')::date + 10,
  'One redemption per customer.',
  10,
  'Show the code to staff before payment.',
  'draft'
);

insert into public.business_deal_locations (deal_id, location_id)
values (
  '27000000-0000-0000-0000-000000000098',
  '21100000-0000-0000-0000-000000000001'
);

update public.business_deals
set status = 'published'
where id = '27000000-0000-0000-0000-000000000098';

insert into public.business_deal_claims (
  id,
  deal_id,
  customer_id,
  claim_reference,
  redemption_code,
  claimed_at,
  expires_at
)
values
  (
    '28000000-0000-0000-0000-000000000097',
    '27000000-0000-0000-0000-000000000098',
    '10000000-0000-0000-0000-000000000001',
    'LL-A097-0001',
    'VALID0097001',
    now() - interval '1 minute',
    now() + interval '14 minutes'
  ),
  (
    '28000000-0000-0000-0000-000000000098',
    '27000000-0000-0000-0000-000000000098',
    '70000000-0000-0000-0000-000000000001',
    'LL-E097-0002',
    'EXPIRED09700',
    now() - interval '20 minutes',
    now() - interval '5 minutes'
  ),
  (
    '28000000-0000-0000-0000-000000000099',
    '27000000-0000-0000-0000-000000000098',
    '30000000-0000-0000-0000-000000000001',
    'LL-A097-0003',
    'VALUE0097001',
    now() - interval '1 minute',
    now() + interval '14 minutes'
  );

select ok(
  not exists (
    select 1
    from public.business_deal_claims
    where claim_reference !~ '^LL-[0-9A-F]{4}-[0-9A-F]{4}$'
  ),
  'claim references use the agreed human-readable format'
);

select is(
  (
    select count(*)
    from public.business_deal_redemptions
    where claim_id = '28000000-0000-0000-0000-000000000097'
  ),
  0::bigint,
  'checking a claim starts without completing its redemption'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select deal_title
    from public.validate_business_deal_redemption_code('VALID 0097 001')
  ),
  'US0097 redemption deal',
  'a valid entered code displays the relevant deal and claim'
);

select is(
  (
    select customer_name
    from public.validate_business_deal_redemption_code('VALID0097001')
  ),
  'Casey C.',
  'validation exposes a first name and last initial'
);

select is(
  (
    select redemption_status
    from public.lookup_business_deal_claim('LL A097 0001')
  ),
  'not_redeemed',
  'reference lookup shows that an unredeemed claim has no redemption'
);

select throws_ok(
  $$
    select *
    from public.redeem_business_deal_claim_by_code('LL-A097-0001')
  $$,
  'P0002',
  'Redemption code not found',
  'a claim reference cannot authorise redemption'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select *
    from public.lookup_business_deal_claim('LL-A097-0001')
  $$,
  '42501',
  'This claim belongs to another business',
  'claim reference lookup is limited to the owning business'
);

select throws_ok(
  $$
    select *
    from public.validate_business_deal_redemption_code('VALID0097001')
  $$,
  '42501',
  'This code belongs to another business',
  'a wrong-business code has a distinct error'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select *
    from public.validate_business_deal_redemption_code('INVALID00000')
  $$,
  'P0002',
  'Redemption code not found',
  'an invalid code has a distinct error'
);

select throws_ok(
  $$
    select *
    from public.validate_business_deal_redemption_code('EXPIRED09700')
  $$,
  '55000',
  'This claim''s redemption window has expired',
  'an expired code has a distinct validation error'
);

select throws_ok(
  $$
    select *
    from public.redeem_business_deal_claim_by_code('EXPIRED09700')
  $$,
  '55000',
  'This claim''s redemption window has expired',
  'an expired claim cannot be redeemed'
);

select throws_ok(
  $$
    select * from public.redeem_business_deal_claim_by_code(
      'VALID0097001', -1, null
    )
  $$,
  '22023',
  'Enter a valid transaction amount',
  'negative transaction amounts are rejected'
);

select throws_ok(
  $$
    select * from public.redeem_business_deal_claim_by_code(
      'VALID0097001', null, -1
    )
  $$,
  '22023',
  'Enter a valid customer savings amount',
  'negative savings amounts are rejected'
);

select lives_ok(
  $$
    select *
    from public.redeem_business_deal_claim_by_code('VALID0097001')
  $$,
  'explicit confirmation completes a valid redemption'
);

select ok(
  (
    select redeemed_at is not null
    from public.business_deal_redemptions
    where claim_id = '28000000-0000-0000-0000-000000000097'
  ),
  'confirming redemption records its date and time'
);

select ok(
  (
    select transaction_amount_cents is null
      and savings_amount_cents is null
    from public.business_deal_redemptions
    where claim_id = '28000000-0000-0000-0000-000000000097'
  ),
  'the existing one-argument redemption flow preserves unknown values as null'
);

select lives_ok(
  $$
    select *
    from public.redeem_business_deal_claim_by_code(
      'VALUE0097001',
      12500,
      2500
    )
  $$,
  'redemption can record optional transaction and savings values'
);

select is(
  (
    select transaction_amount_cents
    from public.business_deal_redemptions
    where claim_id = '28000000-0000-0000-0000-000000000099'
  ),
  12500,
  'the transaction value is stored in cents'
);

select is(
  (
    select savings_amount_cents
    from public.business_deal_redemptions
    where claim_id = '28000000-0000-0000-0000-000000000099'
  ),
  2500,
  'the customer savings value is stored in cents'
);

select is(
  (
    select count(*)
    from public.business_deal_redemptions
    where claim_id = '28000000-0000-0000-0000-000000000099'
  ),
  1::bigint,
  'a valued redemption is still recorded exactly once'
);

select ok(
  (
    select redemption_status = 'redeemed' and redeemed_at is not null
    from public.lookup_business_deal_claim('LL-A097-0001')
  ),
  'reference lookup shows when the claim was redeemed'
);

select is(
  (
    select count(*)
    from public.business_deal_redemptions
    where claim_id = '28000000-0000-0000-0000-000000000097'
  ),
  1::bigint,
  'the claim has exactly one redemption record'
);

select throws_ok(
  $$
    select *
    from public.redeem_business_deal_claim_by_code('VALID0097001')
  $$,
  '55000',
  'This claim has already been redeemed',
  'a redeemed claim cannot be redeemed again'
);

select throws_ok(
  $$
    select *
    from public.validate_business_deal_redemption_code('VALID0097001')
  $$,
  '55000',
  'This claim has already been redeemed',
  'an already-redeemed code has a distinct validation error'
);

select is(
  (
    select count(*)
    from public.get_business_deal_redemptions(
      '21000000-0000-0000-0000-000000000001'
    )
    where deal_id = '27000000-0000-0000-0000-000000000098'
      and claim_reference = 'LL-A097-0001'
  ),
  1::bigint,
  'the redemption appears in the business deal records'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select ok(
  (
    select redeemed_at is not null
    from public.get_my_business_deal_claims()
    where deal_id = '27000000-0000-0000-0000-000000000098'
      and redemption_code = 'VALID0097001'
  ),
  'the redemption appears in the consumer deal history'
);

select is(
  (
    select redemption_code
    from public.get_my_business_deal_claims()
    where deal_id = '27000000-0000-0000-0000-000000000098'
  ),
  'VALID0097001',
  'the consumer can reopen the same claim code from history'
);

select is(
  (
    select claim_reference
    from public.get_my_business_deal_claims()
    where deal_id = '27000000-0000-0000-0000-000000000098'
  ),
  'LL-A097-0001',
  'the customer can see the reference associated with the QR code'
);

select * from finish();

rollback;
