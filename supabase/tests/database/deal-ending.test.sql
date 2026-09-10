begin;

select plan(23);

select has_function(
  'public',
  'get_business_deal_end_summary',
  array['uuid'],
  'the business can check the impact before confirming'
);

select has_function(
  'public',
  'end_business_deal',
  array['uuid'],
  'the atomic early-ending function exists'
);

select has_function(
  'public',
  'get_my_business_deal_claims',
  array[]::text[],
  'customers can retrieve retained claim and redemption history'
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
    '27000000-0000-0000-0000-000000000096',
    '21000000-0000-0000-0000-000000000001',
    'US0096 claimed active deal',
    'An active claimed deal used to verify safe early ending.',
    'Trades',
    'https://example.test/us0096-claimed.jpg',
    'percentage_discount',
    20,
    true,
    (now() at time zone 'Pacific/Auckland')::date - 1,
    (now() at time zone 'Pacific/Auckland')::date + 10,
    'Existing claims remain valid.',
    10,
    'Show the claim to staff before payment.',
    'draft'
  ),
  (
    '27000000-0000-0000-0000-000000000097',
    '21000000-0000-0000-0000-000000000001',
    'US0096 unclaimed active deal',
    'An active unclaimed deal used to prevent unnecessary notifications.',
    'Trades',
    'https://example.test/us0096-unclaimed.jpg',
    'percentage_discount',
    10,
    true,
    (now() at time zone 'Pacific/Auckland')::date - 1,
    (now() at time zone 'Pacific/Auckland')::date + 10,
    'No special conditions.',
    10,
    'Show the deal to staff before payment.',
    'draft'
  );

insert into public.business_deal_locations (deal_id, location_id)
values
  (
    '27000000-0000-0000-0000-000000000096',
    '21100000-0000-0000-0000-000000000001'
  ),
  (
    '27000000-0000-0000-0000-000000000097',
    '21100000-0000-0000-0000-000000000001'
  );

update public.business_deals
set status = 'published'
where id in (
  '27000000-0000-0000-0000-000000000096',
  '27000000-0000-0000-0000-000000000097'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select (public.claim_business_deal(
      '27000000-0000-0000-0000-000000000096'
    )).id
  $$,
  'the customer has an existing claim before the deal ends'
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
    select * from public.end_business_deal(
      '27000000-0000-0000-0000-000000000096'
    )
  $$,
  '42501',
  'Business membership required',
  'a member of another business cannot end the deal'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select claim_count
    from public.get_business_deal_end_summary(
      '27000000-0000-0000-0000-000000000096'
    )
  ),
  1,
  'the system checks and reports the existing claim before confirmation'
);

select is(
  (
    select unredeemed_claim_count
    from public.get_business_deal_end_summary(
      '27000000-0000-0000-0000-000000000096'
    )
  ),
  1,
  'the confirmation summary identifies the claim that remains redeemable'
);

select is(
  (
    select claim_count
    from public.end_business_deal(
      '27000000-0000-0000-0000-000000000096'
    )
  ),
  1,
  'ending the deal atomically rechecks its claims'
);

reset role;

select is(
  (
    select status
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000096'
  ),
  'ended_early',
  'the deal receives the Ended Early status'
);

select ok(
  (
    select ended_at is not null
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000096'
  ),
  'the date and time the deal ended are recorded'
);

select is(
  (
    select count(*)
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000096'
  ),
  1::bigint,
  'a deal with existing claims is not permanently deleted'
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
    where id = '27000000-0000-0000-0000-000000000096'
  ),
  0::bigint,
  'the ended deal is removed from consumer discovery immediately'
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
      '27000000-0000-0000-0000-000000000096'
    )).id
  $$,
  '55000',
  'Deal is not active',
  'ending the deal immediately prevents new claims'
);

reset role;

select is(
  (
    select count(*)
    from public.business_deal_claims
    where deal_id = '27000000-0000-0000-0000-000000000096'
  ),
  1::bigint,
  'the existing claim remains stored'
);

select is(
  (
    select count(*)
    from public.customer_notifications
    where related_deal_id = '27000000-0000-0000-0000-000000000096'
      and notification_type = 'deal_ended'
  ),
  1::bigint,
  'the customer with an existing claim receives one notification'
);

select matches(
  (
    select message
    from public.customer_notifications
    where related_deal_id = '27000000-0000-0000-0000-000000000096'
  ),
  'remains redeemable under the original terms',
  'the notification explains that the claim remains redeemable'
);

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
        where deal_id = '27000000-0000-0000-0000-000000000096'
      )
    )).id
  $$,
  'an existing claim remains redeemable after the deal ends'
);

reset role;

select is(
  (
    select count(*)
    from public.business_deal_redemptions as redemption
    join public.business_deal_claims as claim on claim.id = redemption.claim_id
    where claim.deal_id = '27000000-0000-0000-0000-000000000096'
  ),
  1::bigint,
  'the redemption record remains available'
);

select is(
  (
    select count(*)
    from public.business_deal_status_events
    where deal_id = '27000000-0000-0000-0000-000000000096'
      and status = 'ended_early'
  ),
  1::bigint,
  'the Ended Early transition is retained in status history'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select status
    from public.get_my_business_deal_claims()
    where deal_id = '27000000-0000-0000-0000-000000000096'
  ),
  'ended_early',
  'the customer can still access the ended deal through claim history'
);

select ok(
  (
    select redeemed_at is not null
    from public.get_my_business_deal_claims()
    where deal_id = '27000000-0000-0000-0000-000000000096'
  ),
  'the customer can still access the redemption timestamp'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select notifications_created
    from public.end_business_deal(
      '27000000-0000-0000-0000-000000000097'
    )
  ),
  0,
  'ending a deal without claims creates no customer notifications'
);

reset role;

select is(
  (
    select count(*)
    from public.customer_notifications
    where related_deal_id = '27000000-0000-0000-0000-000000000097'
  ),
  0::bigint,
  'an unclaimed deal does not generate unnecessary notification records'
);

select * from finish();
rollback;
