begin;

select plan(17);

select has_table(
  'public',
  'customer_loyalty_records',
  'customer loyalty records are stored by the platform'
);

select has_function(
  'public',
  'lookup_business_loyalty_record',
  array['uuid', 'text'],
  'the business loyalty-record lookup function exists'
);

select has_function(
  'public',
  'get_my_loyalty_records',
  array[]::text[],
  'customers can load their own loyalty QR records'
);

insert into public.business_loyalty_programmes (
  id,
  business_id,
  name,
  programme_type,
  reward_threshold,
  reward_value,
  start_date,
  status
)
values
  (
    '47000000-0000-0000-0000-000000000109',
    '41000000-0000-0000-0000-000000000001',
    'Morning coffee rewards',
    'visit_card',
    8,
    null,
    (now() at time zone 'Pacific/Auckland')::date,
    'published'
  ),
  (
    '57000000-0000-0000-0000-000000000109',
    '51000000-0000-0000-0000-000000000001',
    'Fresh flower rewards',
    'spend_and_save',
    50,
    5,
    (now() at time zone 'Pacific/Auckland')::date,
    'published'
  );

insert into public.customer_loyalty_records (
  id,
  programme_id,
  customer_id,
  loyalty_identifier,
  current_progress
)
values
  (
    '48000000-0000-0000-0000-000000000209',
    '47000000-0000-0000-0000-000000000109',
    '10000000-0000-0000-0000-000000000001',
    'LL-CAFE-0109',
    8
  ),
  (
    '58000000-0000-0000-0000-000000000109',
    '57000000-0000-0000-0000-000000000109',
    '70000000-0000-0000-0000-000000000001',
    'LL-FLOW-0109',
    25
  );

insert into public.customer_loyalty_scan_codes (
  loyalty_record_id,
  scan_code,
  expires_at
)
values (
  '48000000-0000-0000-0000-000000000209',
  'SCAN01090001',
  now() + interval '15 minutes'
);

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.lookup_business_loyalty_record(
      '41000000-0000-0000-0000-000000000001',
      'll cafe 0109'
    )
  ),
  1::bigint,
  'US0109 AC1: a presented identifier finds the customer loyalty record'
);

select is(
  (
    select count(*)
    from public.lookup_business_loyalty_record(
      '41000000-0000-0000-0000-000000000001',
      'locallink:loyalty-record:LLCAFE0109'
    )
  ),
  1::bigint,
  'US0109 AC1: the customer-presented loyalty QR payload finds the record'
);

select is(
  (
    select count(*)
    from public.lookup_business_loyalty_record(
      '41000000-0000-0000-0000-000000000001',
      'locallink:loyalty-record:SCAN01090001'
    )
  ),
  1::bigint,
  'US0109 AC1: a short-lived dynamic loyalty QR resolves to the record'
);

select is(
  (
    select programme_name
    from public.lookup_business_loyalty_record(
      '41000000-0000-0000-0000-000000000001',
      'LL-CAFE-0109'
    )
  ),
  'Morning coffee rewards',
  'US0109 AC2: the record belongs to a programme operated by the business'
);

select is(
  (
    select current_progress
    from public.lookup_business_loyalty_record(
      '41000000-0000-0000-0000-000000000001',
      'LL-CAFE-0109'
    )
  ),
  8::numeric,
  'US0109 AC3: the business can see current customer progress'
);

select is(
  (
    select reward_eligible
    from public.lookup_business_loyalty_record(
      '41000000-0000-0000-0000-000000000001',
      'LL-CAFE-0109'
    )
  ),
  true,
  'US0109 AC3: the business can see current reward eligibility'
);

select is(
  (
    select customer_display_name
    from public.lookup_business_loyalty_record(
      '41000000-0000-0000-0000-000000000001',
      'LL-CAFE-0109'
    )
  ),
  'Casey C.',
  'the lookup identifies the customer without exposing contact details'
);

select is(
  (
    select count(*)
    from public.lookup_business_loyalty_record(
      '41000000-0000-0000-0000-000000000001',
      'LL-NOTF-OUND'
    )
  ),
  0::bigint,
  'US0109 AC4: an unrecognised identifier returns no loyalty record'
);

select is(
  (
    select count(*)
    from public.lookup_business_loyalty_record(
      '41000000-0000-0000-0000-000000000001',
      'not a complete identifier'
    )
  ),
  0::bigint,
  'US0109 AC4: an invalid identifier returns no loyalty record'
);

select is(
  (
    select count(*)
    from public.lookup_business_loyalty_record(
      '41000000-0000-0000-0000-000000000001',
      'LL-FLOW-0109'
    )
  ),
  0::bigint,
  'US0109 AC5: a business cannot find another business programme record'
);

select is(
  (
    select count(*)
    from public.customer_loyalty_records
  ),
  0::bigint,
  'business users cannot browse customer loyalty records directly'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.customer_loyalty_records
    where id in (
      '48000000-0000-0000-0000-000000000209',
      '58000000-0000-0000-0000-000000000109'
    )
  ),
  1::bigint,
  'a customer can view only their own loyalty records'
);

select is(
  (
    select count(*)
    from public.get_my_loyalty_records()
    where loyalty_record_id in (
      '48000000-0000-0000-0000-000000000209',
      '58000000-0000-0000-0000-000000000109'
    )
  ),
  1::bigint,
  'the customer QR feed returns only the signed-in customer records'
);

select matches(
  (
    select scan_code
    from public.create_my_loyalty_scan_code(
      '48000000-0000-0000-0000-000000000209'
    )
  ),
  '^[A-Z0-9]{12}$',
  'the customer can mint a new short-lived loyalty scan code'
);

select * from finish();
rollback;
