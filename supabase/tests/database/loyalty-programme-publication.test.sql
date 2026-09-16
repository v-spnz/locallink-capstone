begin;

select plan(12);

select has_function(
  'public',
  'save_business_loyalty_programme',
  array[
    'uuid', 'uuid', 'text', 'text', 'text', 'numeric', 'numeric', 'text',
    'date', 'date', 'text'
  ],
  'the atomic loyalty programme save and publication function exists'
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
      'stamp_card',
      null,
      8,
      null,
      'One reward per customer.',
      (now() at time zone 'Pacific/Auckland')::date + 1,
      (now() at time zone 'Pacific/Auckland')::date + 30,
      'published'
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

select lives_ok(
  $$
    select public.save_business_loyalty_programme(
      '47000000-0000-0000-0000-000000000109',
      '41000000-0000-0000-0000-000000000001',
      'Active lunch rewards',
      'spend_and_save',
      null,
      50,
      5,
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
      '47000000-0000-0000-0000-000000000108',
      '41000000-0000-0000-0000-000000000001',
      'Incomplete publication',
      'stamp_card',
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

select is(
  public.refresh_loyalty_programme_statuses(
    (now() at time zone 'Pacific/Auckland')::date + 1
  ),
  1,
  'scheduled programmes become active on their start date'
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
    from public.business_loyalty_programmes
    where id in (
      '47000000-0000-0000-0000-000000000107',
      '47000000-0000-0000-0000-000000000109',
      '47000000-0000-0000-0000-000000000110'
    )
  ),
  3::bigint,
  'a consumer can view active loyalty programmes'
);

select * from finish();
rollback;
