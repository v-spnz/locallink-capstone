begin;

select plan(24);

select has_function(
  'public',
  'save_business_loyalty_programme',
  array[
    'uuid', 'uuid', 'text', 'text', 'text', 'numeric', 'numeric', 'text',
    'date', 'date', 'text', 'text'
  ],
  'the atomic loyalty programme save and publication function exists'
);

select has_column(
  'public',
  'business_loyalty_programmes',
  'image_url',
  'loyalty programmes can store an optional business image'
);

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.save_business_loyalty_programme(
      '47000000-0000-0000-0000-000000000107',
      '41000000-0000-0000-0000-000000000001',
      'Morning coffee rewards',
      'purchase_card',
      null,
      8,
      null,
      'One reward per customer.',
      (now() at time zone 'Pacific/Auckland')::date + 1,
      (now() at time zone 'Pacific/Auckland')::date + 30,
      'published',
      'https://example.test/coffee-rewards.jpg'
    )
  $$,
  'a complete loyalty programme can be published atomically'
);

select is(
  (
    select status
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000107'
  ),
  'scheduled',
  'a future loyalty programme is stored as Scheduled'
);

select is(
  (
    select count(*)
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000107'
  ),
  1::bigint,
  'publication creates exactly one programme'
);

select is(
  (
    select image_url
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000107'
  ),
  'https://example.test/coffee-rewards.jpg',
  'a programme keeps its optional business image when published'
);

select is(
  (
    select earning_rules
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000107'
  ),
  'Complete 8 purchases to receive the next purchase free.',
  'US0104: purchase cards store a complete customer-facing earning condition'
);

select is(
  (
    select reward_description
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000107'
  ),
  'Next purchase free',
  'US0104: purchase card rewards are derived from the structured template'
);

select lives_ok(
  $$
    select public.save_business_loyalty_programme(
      '47000000-0000-0000-0000-000000000112',
      '41000000-0000-0000-0000-000000000001',
      'Weekly visit rewards',
      'visit_card',
      null,
      4,
      null,
      null,
      (now() at time zone 'Pacific/Auckland')::date,
      null,
      'published'
    )
  $$,
  'a visit-based programme can be published separately'
);

select is(
  (
    select earning_rules
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000112'
  ),
  'Complete 4 visits to receive the next visit free.',
  'visit cards store visit-specific customer-facing earning rules'
);

select is(
  (
    select reward_description
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000112'
  ),
  'Next visit free',
  'visit card rewards are derived separately from purchase card rewards'
);

select lives_ok(
  $$
    select public.save_business_loyalty_programme(
      '47000000-0000-0000-0000-000000000109',
      '41000000-0000-0000-0000-000000000001',
      'Active lunch rewards',
      'spend_and_save',
      null,
      12,
      20,
      null,
      (now() at time zone 'Pacific/Auckland')::date,
      null,
      'published'
    )
  $$,
  'a programme starting today can be published atomically'
);

select is(
  (
    select status
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000109'
  ),
  'active',
  'a programme starting today is stored as Active'
);

select is(
  (
    select earning_rules
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000109'
  ),
  'Spend $12 to receive 20% off.',
  'US0104: percentage discounts are independent of the dollar spend target'
);

select is(
  (
    select reward_description
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000109'
  ),
  '20% off',
  'US0104: spend-and-save rewards are derived from structured values'
);

select lives_ok(
  $$
    select public.save_business_loyalty_programme(
      '47000000-0000-0000-0000-000000000110',
      '41000000-0000-0000-0000-000000000001',
      'Lunch reward',
      'spend_and_reward',
      'sandwich',
      25,
      null,
      null,
      (now() at time zone 'Pacific/Auckland')::date,
      null,
      'published'
    )
  $$,
  'a spend-and-reward programme can be published'
);

select is(
  (
    select earning_rules
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000110'
  ),
  'Spend $25 to receive a free sandwich.',
  'the customer-facing earning rules are generated from the template'
);

select throws_ok(
  $$
    select public.save_business_loyalty_programme(
      '47000000-0000-0000-0000-000000000111',
      '41000000-0000-0000-0000-000000000001',
      'Invalid spend and save reward',
      'spend_and_save',
      null,
      80,
      12,
      null,
      (now() at time zone 'Pacific/Auckland')::date,
      null,
      'published'
    )
  $$,
  '23514',
  'new row for relation "business_loyalty_programmes" violates check constraint "business_loyalty_programmes_reward_value_check"',
  'US0104: a percentage outside the five-point options cannot be confirmed'
);

select is(
  (
    select count(*)
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000111'
  ),
  0::bigint,
  'US0104: a rejected earning condition is not saved to another programme'
);

select throws_ok(
  $$
    select public.save_business_loyalty_programme(
      '47000000-0000-0000-0000-000000000108',
      '41000000-0000-0000-0000-000000000001',
      'Incomplete publication',
      'visit_card',
      null,
      null,
      null,
      null,
      (now() at time zone 'Pacific/Auckland')::date,
      null,
      'published'
    )
  $$,
  '23514',
  'Complete every required loyalty programme field before publishing',
  'an incomplete programme cannot be published'
);

select is(
  (
    select count(*)
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000108'
  ),
  0::bigint,
  'failed publication leaves no partial programme to duplicate'
);

reset role;

select public.refresh_loyalty_programme_statuses(
  (now() at time zone 'Pacific/Auckland')::date + 1
);

select is(
  (select status from public.business_loyalty_programmes
   where id = '47000000-0000-0000-0000-000000000107'),
  'active',
  'scheduled programmes become active on their start date'
);

update public.profiles
set
  suburb = 'Mount Wellington',
  location = extensions.st_setsrid(
    extensions.st_makepoint(174.8331, -36.9080),
    4326
  )::extensions.geography
where id = '10000000-0000-0000-0000-000000000001';

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.business_loyalty_programmes
    where id in (
      '47000000-0000-0000-0000-000000000107',
      '47000000-0000-0000-0000-000000000109',
      '47000000-0000-0000-0000-000000000110',
      '47000000-0000-0000-0000-000000000112'
    )
  ),
  4::bigint,
  'a consumer can view active loyalty programmes'
);

select is(
  (
    select count(*)
    from public.discover_loyalty_programmes()
    where programme_id = '47000000-0000-0000-0000-000000000109'
  ),
  1::bigint,
  'a consumer can discover an active programme without being a business member'
);

select * from finish();
rollback;
