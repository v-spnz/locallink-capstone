begin;

select plan(14);

select is(
  public.fifteen_business_days_after('2026-10-01'::date),
  '2026-10-22'::date,
  'the protected completion window counts fifteen weekdays'
);

insert into public.business_loyalty_programmes (
  id, business_id, name, programme_type, reward_threshold, start_date,
  end_date, status
)
values
  (
    '97000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001',
    'Lifecycle draft', null, null, null, null, 'draft'
  ),
  (
    '97000000-0000-0000-0000-000000000002',
    '41000000-0000-0000-0000-000000000001',
    'Lifecycle scheduled', 'visit_card', 5,
    (now() at time zone 'Pacific/Auckland')::date + 10,
    (now() at time zone 'Pacific/Auckland')::date + 30,
    'published'
  ),
  (
    '97000000-0000-0000-0000-000000000003',
    '41000000-0000-0000-0000-000000000001',
    'Lifecycle active', 'visit_card', 5,
    (now() at time zone 'Pacific/Auckland')::date,
    (now() at time zone 'Pacific/Auckland')::date + 5,
    'published'
  );

insert into public.customer_loyalty_records (
  id, programme_id, customer_id, loyalty_identifier, current_progress
)
values (
  '97000000-0000-0000-0000-000000000010',
  '97000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  'LL-LIFE-0001',
  2
);

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  public.delete_business_loyalty_programme_draft(
    '97000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001'
  ),
  '97000000-0000-0000-0000-000000000001'::uuid,
  'an authorised business can delete its draft'
);

select is(
  (
    select count(*) from public.business_loyalty_programmes
    where id = '97000000-0000-0000-0000-000000000001'
  ),
  0::bigint,
  'draft deletion removes the programme'
);

select is(
  public.cancel_business_loyalty_programme_schedule(
    '97000000-0000-0000-0000-000000000002',
    '41000000-0000-0000-0000-000000000001'
  ),
  '97000000-0000-0000-0000-000000000002'::uuid,
  'an authorised business can cancel a scheduled programme'
);

select is(
  (
    select status from public.business_loyalty_programmes
    where id = '97000000-0000-0000-0000-000000000002'
  ),
  'draft',
  'cancelling a schedule returns the programme to draft'
);

select is(
  (
    select customer_count
    from public.get_business_loyalty_programme_end_summary(
      '97000000-0000-0000-0000-000000000003',
      '41000000-0000-0000-0000-000000000001'
    )
  ),
  1::bigint,
  'the warning summary counts affected customers'
);

select is(
  (
    select completion_deadline
    from public.get_business_loyalty_programme_end_summary(
      '97000000-0000-0000-0000-000000000003',
      '41000000-0000-0000-0000-000000000001'
    )
  ),
  (now() at time zone 'Pacific/Auckland')::date + 5,
  'the original expiry wins when it is sooner than fifteen business days'
);

select lives_ok(
  $$
    select * from public.end_business_loyalty_programme_early(
      '97000000-0000-0000-0000-000000000003',
      '41000000-0000-0000-0000-000000000001'
    )
  $$,
  'an active programme can be ended early atomically'
);

select is(
  (
    select status from public.business_loyalty_programmes
    where id = '97000000-0000-0000-0000-000000000003'
  ),
  'ended_early',
  'ending early creates a distinct terminal lifecycle status'
);

reset role;

select is(
  (
    select count(*) from public.customer_notifications
    where related_loyalty_record_id = '97000000-0000-0000-0000-000000000010'
      and notification_type = 'loyalty_programme_ended_early'
  ),
  1::bigint,
  'each existing customer receives one end-early notification'
);

set local role authenticated;

select ok(
  public.loyalty_programme_accepts_existing_activity(
    'ended_early',
    (now() at time zone 'Pacific/Auckland')::date + 5
  ),
  'existing loyalty records stay usable during the protected window'
);

select lives_ok(
  $$
    select * from public.add_loyalty_progress(
      '97000000-0000-0000-0000-000000000010', 1
    )
  $$,
  'the business can keep recording progress during the protected window'
);

select ok(
  not public.loyalty_programme_accepts_existing_activity(
    'ended_early',
    (now() at time zone 'Pacific/Auckland')::date - 1
  ),
  'activity is rejected after the protected deadline'
);

select throws_ok(
  $$
    select public.delete_business_loyalty_programme_draft(
      '97000000-0000-0000-0000-000000000003',
      '41000000-0000-0000-0000-000000000001'
    )
  $$,
  'P0002',
  'Draft loyalty programme not found',
  'an ended programme cannot be deleted as a draft'
);

select * from finish();
rollback;
