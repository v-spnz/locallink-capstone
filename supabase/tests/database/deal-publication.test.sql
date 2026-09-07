begin;

select plan(7);

select has_function(
  'public',
  'save_business_deal',
  array[
    'uuid', 'uuid', 'text', 'text', 'text', 'text', 'text', 'numeric',
    'integer', 'integer', 'integer', 'text', 'date', 'date', 'text',
    'integer', 'text', 'text', 'uuid[]', 'text'
  ],
  'the atomic deal save and publication function exists'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.save_business_deal(
      '27000000-0000-0000-0000-000000000091',
      '21000000-0000-0000-0000-000000000001',
      'US0091 scheduled deal',
      'A complete future deal created by the publication acceptance test.',
      'Trades',
      'https://example.test/us0091.jpg',
      'percentage_discount',
      15,
      null,
      null,
      null,
      null,
      current_date + 1,
      current_date + 10,
      'Bookings are required.',
      50,
      'Excludes public holidays.',
      'Show the LocalLink deal before booking.',
      array['21100000-0000-0000-0000-000000000001']::uuid[],
      'published'
    )
  $$,
  'a complete future deal can be published atomically'
);

select is(
  (
    select status
    from public.business_deals
    where business_id = '21000000-0000-0000-0000-000000000001'
      and title = 'US0091 scheduled deal'
  ),
  'published',
  'the atomic save records a published deal'
);

select lives_ok(
  $$
    select public.save_business_deal(
      '27000000-0000-0000-0000-000000000091',
      '21000000-0000-0000-0000-000000000001',
      'US0091 scheduled deal',
      'The same deal is safely retried without creating a duplicate row.',
      'Trades',
      'https://example.test/us0091.jpg',
      'percentage_discount',
      15,
      null,
      null,
      null,
      null,
      current_date + 1,
      current_date + 10,
      'Bookings are required.',
      50,
      'Excludes public holidays.',
      'Show the LocalLink deal before booking.',
      array['21100000-0000-0000-0000-000000000001']::uuid[],
      'published'
    )
  $$,
  'retrying a known deal updates the same deal'
);

select is(
  (
    select count(*)
    from public.business_deals
    where business_id = '21000000-0000-0000-0000-000000000001'
      and title = 'US0091 scheduled deal'
  ),
  1::bigint,
  'a retry does not create a duplicate deal'
);

select throws_ok(
  $$
    select public.save_business_deal(
      '27000000-0000-0000-0000-000000000092',
      '21000000-0000-0000-0000-000000000001',
      'US0091 failed publication',
      null,
      'Trades',
      'https://example.test/us0091-failed.jpg',
      'percentage_discount',
      15,
      null,
      null,
      null,
      null,
      current_date,
      current_date + 10,
      null,
      50,
      null,
      null,
      array['21100000-0000-0000-0000-000000000001']::uuid[],
      'published'
    )
  $$,
  '23514',
  'Complete every required deal field before publishing',
  'invalid information prevents publication'
);

select is(
  (
    select count(*)
    from public.business_deals
    where business_id = '21000000-0000-0000-0000-000000000001'
      and title = 'US0091 failed publication'
  ),
  0::bigint,
  'failed publication leaves no partial deal to duplicate on retry'
);

select * from finish();
rollback;
