begin;

select plan(26);

select is(
  (
    select count(*)::integer
    from cron.job
    where jobname = 'refresh-business-deal-statuses'
  ),
  1,
  'the deal lifecycle refresh job is scheduled once'
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
values
  (
    '27000000-0000-0000-0000-000000000094',
    '21000000-0000-0000-0000-000000000001',
    'US0094 scheduled deal',
    'A future deal used to verify automatic availability changes.',
    'Trades',
    'https://example.test/us0094-scheduled.jpg',
    'percentage_discount',
    15,
    true,
    (now() at time zone 'Pacific/Auckland')::date + 1,
    (now() at time zone 'Pacific/Auckland')::date + 3,
    'Bookings are required.',
    10,
    'Show the claim to staff before booking.',
    'draft'
  ),
  (
    '27000000-0000-0000-0000-000000000095',
    '21000000-0000-0000-0000-000000000001',
    'US0094 active deal',
    'An active deal used to verify claims and expiry behaviour.',
    'Trades',
    'https://example.test/us0094-active.jpg',
    'percentage_discount',
    20,
    true,
    (now() at time zone 'Pacific/Auckland')::date - 1,
    (now() at time zone 'Pacific/Auckland')::date + 1,
    'One claim per customer.',
    10,
    'Show the claim to staff before payment.',
    'draft'
  );

insert into public.business_deal_locations (deal_id, location_id)
values
  (
    '27000000-0000-0000-0000-000000000094',
    '21100000-0000-0000-0000-000000000001'
  ),
  (
    '27000000-0000-0000-0000-000000000095',
    '21100000-0000-0000-0000-000000000001'
  );

update public.business_deals
set status = 'published'
where id in (
  '27000000-0000-0000-0000-000000000094',
  '27000000-0000-0000-0000-000000000095'
);

select is(
  (
    select status
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000094'
  ),
  'scheduled',
  'a future published deal starts as Scheduled'
);

select is(
  (
    select status
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000095'
  ),
  'active',
  'a currently valid published deal starts as Active'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000094'
  ),
  0::bigint,
  'a consumer cannot discover a Scheduled deal before its start date'
);

select is(
  (
    select count(*)
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000095'
  ),
  1::bigint,
  'a consumer can discover an Active deal during its valid period'
);

select throws_ok(
  $$
    select (public.claim_business_deal(
      '27000000-0000-0000-0000-000000000094'
    )).id
  $$,
  '55000',
  'Deal is not active',
  'a Scheduled deal cannot be claimed before its start date'
);

select lives_ok(
  $$
    select (public.claim_business_deal(
      '27000000-0000-0000-0000-000000000095'
    )).id
  $$,
  'an Active deal can be claimed during its valid period'
);

select is(
  (
    select count(*)
    from public.business_deal_claims
    where deal_id = '27000000-0000-0000-0000-000000000095'
      and customer_id = '10000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'the active claim is stored once'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select (public.redeem_business_deal_claim(
      (
        select id
        from public.business_deal_claims
        where deal_id = '27000000-0000-0000-0000-000000000095'
      )
    )).id
  $$,
  'a business member can store a redemption for an existing claim'
);

reset role;

select lives_ok(
  $$
    select public.refresh_business_deal_statuses(
      (now() at time zone 'Pacific/Auckland')::date + 1
    )
  $$,
  'the lifecycle job runs when the Scheduled deal reaches its start date'
);

select is(
  (
    select status
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000094'
  ),
  'active',
  'a Scheduled deal automatically becomes Active on its start date'
);

select is(
  (
    select count(*)
    from public.business_deal_status_events
    where deal_id = '27000000-0000-0000-0000-000000000094'
      and status = 'active'
  ),
  1::bigint,
  'the automatic Active transition is recorded once'
);

select lives_ok(
  $$
    select public.refresh_business_deal_statuses(
      (now() at time zone 'Pacific/Auckland')::date + 1
    )
  $$,
  'repeating the lifecycle job is safe'
);

select is(
  (
    select count(*)
    from public.business_deal_status_events
    where deal_id = '27000000-0000-0000-0000-000000000094'
      and status = 'active'
  ),
  1::bigint,
  'a repeated lifecycle run does not repeat the Active transition'
);

select lives_ok(
  $$
    select public.refresh_business_deal_statuses(
      (now() at time zone 'Pacific/Auckland')::date + 2
    )
  $$,
  'the lifecycle job runs after the active fixture end date'
);

select is(
  (
    select status
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000095'
  ),
  'expired',
  'an Active deal automatically becomes Expired after its end date'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000095'
  ),
  0::bigint,
  'an Expired deal is removed from consumer discovery'
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
    select (public.claim_business_deal(
      '27000000-0000-0000-0000-000000000095'
    )).id
  $$,
  '55000',
  'Deal is not active',
  'an Expired deal cannot receive a new claim'
);

reset role;

select is(
  (
    select count(*)
    from public.business_deal_claims
    where deal_id = '27000000-0000-0000-0000-000000000095'
  ),
  1::bigint,
  'an existing claim remains stored after expiry'
);

select is(
  (
    select count(*)
    from public.business_deal_redemptions as redemption
    join public.business_deal_claims as claim on claim.id = redemption.claim_id
    where claim.deal_id = '27000000-0000-0000-0000-000000000095'
  ),
  1::bigint,
  'an existing redemption remains stored after expiry'
);

select is(
  (
    select count(*)
    from public.business_deal_status_events
    where deal_id = '27000000-0000-0000-0000-000000000095'
      and status = 'expired'
  ),
  1::bigint,
  'the automatic Expired transition is recorded once'
);

select lives_ok(
  $$
    select public.refresh_business_deal_statuses(
      (now() at time zone 'Pacific/Auckland')::date + 4
    )
  $$,
  'the lifecycle job expires the second deal after its end date'
);

select is(
  (
    select status
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000094'
  ),
  'expired',
  'the second Active deal also becomes Expired'
);

select is(
  (
    select count(*)
    from public.business_deal_status_events
    where deal_id = '27000000-0000-0000-0000-000000000094'
      and status = 'expired'
  ),
  1::bigint,
  'the second automatic Expired transition is recorded once'
);

select lives_ok(
  $$
    select public.refresh_business_deal_statuses(
      (now() at time zone 'Pacific/Auckland')::date + 4
    )
  $$,
  'repeating the expiry lifecycle job is safe'
);

select is(
  (
    select count(*)
    from public.business_deal_status_events
    where deal_id = '27000000-0000-0000-0000-000000000094'
      and status = 'expired'
  ),
  1::bigint,
  'a repeated lifecycle run does not repeat the Expired transition'
);

select * from finish();
rollback;
