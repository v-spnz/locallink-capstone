begin;

select plan(11);

select has_table(
  'public',
  'loyalty_activity',
  'loyalty activity history is stored by the platform'
);

select has_column(
  'public',
  'loyalty_activity',
  'activity_type',
  'loyalty activity has a constrained event type'
);

select has_column(
  'public',
  'loyalty_activity',
  'amount',
  'progress activity can store its amount'
);

insert into public.business_loyalty_programmes (
  id,
  business_id,
  name,
  programme_type,
  reward_threshold,
  start_date,
  status
)
values (
  '95000000-0000-0000-0000-000000000001',
  '41000000-0000-0000-0000-000000000001',
  'Activity history test',
  'stamp_card',
  8,
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
    '95000000-0000-0000-0000-000000000011',
    '95000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'LL-ACTV-0001',
    1
  ),
  (
    '95000000-0000-0000-0000-000000000012',
    '95000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',
    'LL-ACTV-0002',
    0
  );

select lives_ok(
  $$
    insert into public.loyalty_activity (
      loyalty_record_id, activity_type, amount
    ) values (
      '95000000-0000-0000-0000-000000000011', 'progress_added', 1
    )
  $$,
  'positive progress activity is valid'
);

select lives_ok(
  $$
    insert into public.loyalty_activity (
      loyalty_record_id, activity_type, amount
    ) values (
      '95000000-0000-0000-0000-000000000011', 'reward_earned', null
    )
  $$,
  'a reward-earned event is valid without an amount'
);

select lives_ok(
  $$
    insert into public.loyalty_activity (
      loyalty_record_id, activity_type, amount
    ) values (
      '95000000-0000-0000-0000-000000000012', 'reward_redeemed', null
    )
  $$,
  'a reward-redeemed event is valid without an amount'
);

select throws_ok(
  $$
    insert into public.loyalty_activity (
      loyalty_record_id, activity_type, amount
    ) values (
      '95000000-0000-0000-0000-000000000011', 'custom_event', null
    )
  $$,
  '23514',
  'new row for relation "loyalty_activity" violates check constraint "loyalty_activity_activity_type_check"',
  'arbitrary loyalty activity types are rejected'
);

select throws_ok(
  $$
    insert into public.loyalty_activity (
      loyalty_record_id, activity_type, amount
    ) values (
      '95000000-0000-0000-0000-000000000011', 'progress_added', null
    )
  $$,
  '23514',
  'new row for relation "loyalty_activity" violates check constraint "loyalty_activity_amount_check"',
  'progress activity requires an amount'
);

select throws_ok(
  $$
    insert into public.loyalty_activity (
      loyalty_record_id, activity_type, amount
    ) values (
      '95000000-0000-0000-0000-000000000011', 'reward_earned', 1
    )
  $$,
  '23514',
  'new row for relation "loyalty_activity" violates check constraint "loyalty_activity_amount_check"',
  'reward lifecycle events cannot carry progress amounts'
);

select ok(
  not has_table_privilege('authenticated', 'public.loyalty_activity', 'INSERT')
    and not has_table_privilege('authenticated', 'public.loyalty_activity', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.loyalty_activity', 'DELETE'),
  'authenticated users cannot mutate append-only loyalty history directly'
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
    from public.loyalty_activity
    where loyalty_record_id in (
      '95000000-0000-0000-0000-000000000011',
      '95000000-0000-0000-0000-000000000012'
    )
  ),
  2::bigint,
  'customers can view activity only for their own loyalty records'
);

select * from finish();
rollback;
