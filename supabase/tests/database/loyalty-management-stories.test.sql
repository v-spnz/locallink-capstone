begin;

select plan(14);

select has_function(
  'public',
  'get_business_loyalty_activity',
  array['uuid', 'integer'],
  'US0112 exposes a business-scoped loyalty activity feed'
);

insert into public.business_loyalty_programmes (
  id,
  business_id,
  name,
  programme_type,
  reward_threshold,
  start_date,
  end_date,
  status
)
values
  (
    '96000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001',
    'Active management test',
    'visit_card',
    2,
    (now() at time zone 'Pacific/Auckland')::date,
    null,
    'published'
  ),
  (
    '96000000-0000-0000-0000-000000000002',
    '41000000-0000-0000-0000-000000000001',
    'Scheduled management test',
    'visit_card',
    2,
    (now() at time zone 'Pacific/Auckland')::date + 7,
    (now() at time zone 'Pacific/Auckland')::date + 30,
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
    '96000000-0000-0000-0000-000000000011',
    '96000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'LL-MGMT-0001',
    1
  ),
  (
    '96000000-0000-0000-0000-000000000012',
    '96000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'LL-MGMT-0002',
    2
  );

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select *
    from public.add_loyalty_progress(
      '96000000-0000-0000-0000-000000000011',
      1
    )
  $$,
  'US0106 allows progress while the programme is active'
);

reset role;

select is(
  (
    select current_progress
    from public.customer_loyalty_records
    where id = '96000000-0000-0000-0000-000000000011'
  ),
  2::numeric,
  'active progress is persisted against the customer record'
);

select is(
  (
    select count(*)
    from public.loyalty_activity
    where loyalty_record_id = '96000000-0000-0000-0000-000000000011'
      and activity_type = 'progress_added'
  ),
  1::bigint,
  'US0112 records a progress event'
);

select is(
  (
    select count(*)
    from public.loyalty_activity
    where loyalty_record_id = '96000000-0000-0000-0000-000000000011'
      and activity_type = 'reward_earned'
  ),
  1::bigint,
  'US0112 records when the customer reaches the reward threshold'
);

set local role authenticated;

select is(
  (
    select count(*)
    from public.get_business_loyalty_activity(
      '41000000-0000-0000-0000-000000000001',
      100
    )
    where programme_id = '96000000-0000-0000-0000-000000000001'
  ),
  2::bigint,
  'the business feed returns its new earning activity'
);

select is(
  (
    select programme_name
    from public.get_business_loyalty_activity(
      '41000000-0000-0000-0000-000000000001',
      100
    )
    where programme_id = '96000000-0000-0000-0000-000000000001'
    limit 1
  ),
  'Active management test',
  'activity rows identify the managed programme'
);

select lives_ok(
  $$
    select *
    from public.redeem_loyalty_reward(
      '96000000-0000-0000-0000-000000000011'
    )
  $$,
  'US0106 allows redemption while the programme is active'
);

reset role;

select is(
  (
    select redemption_count
    from public.customer_loyalty_records
    where id = '96000000-0000-0000-0000-000000000011'
  ),
  1,
  'the successful redemption is persisted'
);

select is(
  (
    select count(*)
    from public.loyalty_activity
    where loyalty_record_id = '96000000-0000-0000-0000-000000000011'
      and activity_type = 'reward_redeemed'
  ),
  1::bigint,
  'US0112 records the successful redemption'
);

set local role authenticated;

select throws_ok(
  $$
    select *
    from public.add_loyalty_progress(
      '96000000-0000-0000-0000-000000000012',
      1
    )
  $$,
  '55000',
  'Loyalty programme is not active',
  'US0106 rejects earning activity before the start date'
);

select throws_ok(
  $$
    select *
    from public.redeem_loyalty_reward(
      '96000000-0000-0000-0000-000000000012'
    )
  $$,
  '55000',
  'Loyalty programme is not active',
  'US0106 rejects redemption before the start date'
);

reset role;

select is(
  (
    select count(*)
    from public.loyalty_activity
    where loyalty_record_id = '96000000-0000-0000-0000-000000000012'
  ),
  0::bigint,
  'rejected inactive operations create no activity history'
);

select set_config(
  'request.jwt.claim.sub',
  '50000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select *
    from public.get_business_loyalty_activity(
      '41000000-0000-0000-0000-000000000001',
      50
    )
  $$,
  '42501',
  'Business loyalty access required',
  'US0112 does not disclose another business activity'
);

select * from finish();
rollback;
