begin;

select plan(38);

select has_function(
  'public',
  'get_business_dashboard_metrics',
  array['uuid', 'date', 'date'],
  'the dashboard summary RPC exists'
);

select has_function(
  'public',
  'get_business_deal_performance',
  array['uuid', 'date', 'date'],
  'the deal performance RPC exists'
);

select has_function(
  'public',
  'get_business_loyalty_programme_performance',
  array['uuid', 'date', 'date'],
  'the loyalty programme performance RPC exists'
);

insert into public.businesses (id, business_name)
values
  ('94000000-0000-0000-0000-000000000001', 'Analytics Business A'),
  ('94000000-0000-0000-0000-000000000002', 'Analytics Business B');

insert into public.business_members (business_id, profile_id, role)
values
  (
    '94000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'owner'
  ),
  (
    '94000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    'owner'
  );

insert into public.business_capabilities (
  business_id,
  deals_enabled,
  loyalty_enabled,
  service_marketplace_enabled
)
values
  ('94000000-0000-0000-0000-000000000001', true, true, true),
  ('94000000-0000-0000-0000-000000000002', true, true, true);

insert into public.business_locations (id, business_id, name)
values (
  '94000000-0000-0000-0000-000000000011',
  '94000000-0000-0000-0000-000000000001',
  'Analytics location'
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
  claim_limit,
  redemption_instructions,
  status
)
values (
  '94000000-0000-0000-0000-000000000021',
  '94000000-0000-0000-0000-000000000001',
  'Analytics deal',
  'A complete active deal used to verify business analytics.',
  'Services',
  'https://example.test/analytics-deal.jpg',
  'percentage_discount',
  20,
  true,
  (now() at time zone 'Pacific/Auckland')::date - 5,
  (now() at time zone 'Pacific/Auckland')::date + 5,
  20,
  'Show the claim before payment.',
  'draft'
);

insert into public.business_deal_locations (deal_id, location_id)
values (
  '94000000-0000-0000-0000-000000000021',
  '94000000-0000-0000-0000-000000000011'
);

update public.business_deals
set status = 'published'
where id = '94000000-0000-0000-0000-000000000021';

insert into public.business_deal_claims (
  id,
  deal_id,
  customer_id,
  claimed_at,
  expires_at
)
values
  (
    '94000000-0000-0000-0000-000000000031',
    '94000000-0000-0000-0000-000000000021',
    '10000000-0000-0000-0000-000000000001',
    now() - interval '2 days',
    now() - interval '2 days' + interval '15 minutes'
  ),
  (
    '94000000-0000-0000-0000-000000000032',
    '94000000-0000-0000-0000-000000000021',
    '70000000-0000-0000-0000-000000000001',
    now() - interval '1 day',
    now() - interval '1 day' + interval '15 minutes'
  );

insert into public.business_deal_redemptions (
  claim_id,
  redeemed_by,
  redeemed_at,
  transaction_amount_cents,
  savings_amount_cents
)
values
  (
    '94000000-0000-0000-0000-000000000031',
    '20000000-0000-0000-0000-000000000001',
    now() - interval '2 days' + interval '5 minutes',
    5000,
    1000
  ),
  (
    '94000000-0000-0000-0000-000000000032',
    '20000000-0000-0000-0000-000000000001',
    now() - interval '1 day' + interval '5 minutes',
    null,
    null
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
  '94000000-0000-0000-0000-000000000041',
  '94000000-0000-0000-0000-000000000001',
  'Analytics loyalty programme',
  'visit_card',
  8,
  (now() at time zone 'Pacific/Auckland')::date - 10,
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
    '94000000-0000-0000-0000-000000000051',
    '94000000-0000-0000-0000-000000000041',
    '10000000-0000-0000-0000-000000000001',
    'LL-TEST-A001',
    1
  ),
  (
    '94000000-0000-0000-0000-000000000052',
    '94000000-0000-0000-0000-000000000041',
    '70000000-0000-0000-0000-000000000001',
    'LL-TEST-A002',
    0
  );

insert into public.loyalty_activity (
  loyalty_record_id,
  activity_type,
  amount,
  created_at
)
values
  (
    '94000000-0000-0000-0000-000000000051',
    'progress_added',
    1,
    now() - interval '1 day'
  ),
  (
    '94000000-0000-0000-0000-000000000051',
    'reward_earned',
    null,
    now() - interval '1 day' + interval '1 minute'
  );

insert into public.job_requests (
  id,
  customer_id,
  title,
  description,
  category,
  job_type,
  city,
  suburb,
  radius_km,
  status,
  created_at,
  updated_at
)
values
  (
    '94000000-0000-0000-0000-000000000061',
    '10000000-0000-0000-0000-000000000001',
    'Completed analytics job',
    'A completed service job used to verify dashboard metrics.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Ponsonby',
    5,
    'completed',
    now() - interval '3 days',
    now() - interval '1 day'
  ),
  (
    '94000000-0000-0000-0000-000000000062',
    '70000000-0000-0000-0000-000000000001',
    'Unquoted analytics lead',
    'A matched lead without a quote for conversion testing.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Ponsonby',
    5,
    'closed',
    now() - interval '2 days',
    now() - interval '1 day'
  );

insert into public.business_job_lead_matches (
  business_id,
  job_request_id,
  matched_at
)
values
  (
    '94000000-0000-0000-0000-000000000001',
    '94000000-0000-0000-0000-000000000061',
    now() - interval '3 days'
  ),
  (
    '94000000-0000-0000-0000-000000000001',
    '94000000-0000-0000-0000-000000000062',
    now() - interval '2 days'
  );

insert into public.job_quotes (
  id,
  job_request_id,
  business_id,
  price_type,
  amount_cents,
  availability_date,
  arrival_window,
  included_work,
  conditions,
  expected_duration,
  message,
  status,
  created_at,
  updated_at
)
values (
  '94000000-0000-0000-0000-000000000071',
  '94000000-0000-0000-0000-000000000061',
  '94000000-0000-0000-0000-000000000001',
  'fixed',
  25000,
  current_date - 1,
  '9:00-10:00 AM',
  'Complete the requested plumbing work.',
  'Property access is required.',
  'One working day',
  'Analytics quote.',
  'accepted',
  now() - interval '2 days',
  now() - interval '2 days'
);

insert into public.job_status_history (job_request_id, status, updated_at)
values
  (
    '94000000-0000-0000-0000-000000000061',
    'accepted',
    now() - interval '2 days'
  ),
  (
    '94000000-0000-0000-0000-000000000061',
    'completed',
    now() - interval '1 day'
  );

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (select total_deals from public.get_business_dashboard_metrics(
    '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
  )),
  1::bigint,
  'deal snapshot counts are scoped to the requested business'
);

select is((select active_deals from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 1::bigint, 'active deal snapshot counts are correct');

select is((select deal_claims from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 2::bigint, 'claim counts use the selected Auckland date range');

select is((select deal_redemptions from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 2::bigint, 'redemption counts are correct');

select is((select deal_claim_cohort_redemptions from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 2::bigint, 'claim cohort redemptions are correct');

select is((select deal_claim_to_redemption_rate from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 100::numeric, 'deal conversion uses the claim cohort');

select is((select unique_deal_customers from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 2::bigint, 'unique deal customer volume is aggregated without exposing identities');

select is((select recorded_transaction_value_cents from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 5000::bigint, 'only recorded transaction values are totalled');

select is((select recorded_customer_savings_cents from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 1000::bigint, 'only recorded customer savings are totalled');

select is((select average_recorded_transaction_cents from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 5000::numeric, 'the average excludes redemptions with unknown transaction values');

select is((select redemptions_with_transaction_value from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 1::bigint, 'transaction-value coverage is returned explicitly');

select is((select claims from public.get_business_deal_performance(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
) where deal_id = '94000000-0000-0000-0000-000000000021'), 2::bigint,
  'deal-level claim counts are correct');

select is((select redemptions from public.get_business_deal_performance(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
) where deal_id = '94000000-0000-0000-0000-000000000021'), 2::bigint,
  'deal-level redemption counts are correct');

select is((select claim_to_redemption_rate from public.get_business_deal_performance(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
) where deal_id = '94000000-0000-0000-0000-000000000021'), 100::numeric,
  'deal-level cohort conversion is correct');

select is((select recorded_transaction_value_cents from public.get_business_deal_performance(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
) where deal_id = '94000000-0000-0000-0000-000000000021'), 5000::bigint,
  'deal-level recorded transaction value is correct');

select is((select claims from public.get_business_deal_performance(
  '94000000-0000-0000-0000-000000000001', current_date + 10, current_date + 10
) where deal_id = '94000000-0000-0000-0000-000000000021'), 0::bigint,
  'date filtering excludes claims outside the selected Auckland day');

select is((select average_recorded_transaction_cents from public.get_business_deal_performance(
  '94000000-0000-0000-0000-000000000001', current_date + 10, current_date + 10
) where deal_id = '94000000-0000-0000-0000-000000000021'), null::numeric,
  'an absent transaction average remains null rather than becoming zero');

select is((select loyalty_customers from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 2::bigint, 'total loyalty customers are counted across business programmes');

select is((select active_loyalty_customers from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 1::bigint, 'active loyalty customers require an activity event in the range');

select is((select loyalty_activity_events from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 2::bigint, 'loyalty activity events are counted correctly');

select is((select loyalty_rewards_earned from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 1::bigint, 'earned rewards are counted from activity history');

select is((select loyalty_rewards_redeemed from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 0::bigint, 'zero reward redemptions return zero');

select is((select marketplace_matched_leads from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 2::bigint, 'durable matched leads are counted correctly');

select is((select marketplace_quotes_submitted from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 1::bigint, 'submitted quote cohorts are counted correctly');

select is((select marketplace_quotes_accepted from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 1::bigint, 'accepted quote cohorts are counted correctly');

select is((select marketplace_jobs_won from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 1::bigint, 'jobs won use accepted quotes');

select is((select marketplace_completed_jobs from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 1::bigint, 'completed jobs use timestamped status history');

select is((select marketplace_lead_to_quote_rate from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 50::numeric, 'lead-to-quote conversion uses the matched-lead cohort');

select is((select marketplace_quote_to_job_rate from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 100::numeric, 'quote-to-job conversion uses the submitted-quote cohort');

select is((select marketplace_lead_to_job_rate from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date - 7, current_date
)), 50::numeric, 'lead-to-job conversion uses the matched-lead cohort');

select is((select deal_claim_to_redemption_rate from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date + 10, current_date + 10
)), 0::numeric, 'a zero claim denominator returns zero');

select is((select marketplace_quote_to_job_rate from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000001', current_date + 10, current_date + 10
)), 0::numeric, 'a zero quote denominator returns zero');

select throws_ok(
  $$
    select * from public.get_business_dashboard_metrics(
      '94000000-0000-0000-0000-000000000001',
      current_date,
      current_date - 1
    )
  $$,
  '22023',
  'Start date must not be after end date',
  'an invalid date range is rejected'
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
    select * from public.get_business_dashboard_metrics(
      '94000000-0000-0000-0000-000000000001',
      current_date - 7,
      current_date
    )
  $$,
  '42501',
  'Business membership required',
  'another business cannot retrieve private analytics'
);

select is((select total_deals from public.get_business_dashboard_metrics(
  '94000000-0000-0000-0000-000000000002', current_date - 7, current_date
)), 0::bigint, 'an empty business does not receive another business''s deal totals');

select * from finish();
rollback;
