begin;

select plan(10);

select has_table(
  'public',
  'business_job_lead_matches',
  'durable business lead matches are stored'
);

select has_column(
  'public',
  'business_job_lead_matches',
  'matched_at',
  'each durable match records when it occurred'
);

select is(
  (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.business_job_lead_matches'::regclass
  ),
  true,
  'durable match records have row-level security enabled'
);

insert into public.businesses (id, business_name)
values (
  '96000000-0000-0000-0000-000000000001',
  'Lead Match Test Business'
);

insert into public.business_members (business_id, profile_id, role)
values (
  '96000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'owner'
);

insert into public.business_capabilities (
  business_id,
  deals_enabled,
  loyalty_enabled,
  service_marketplace_enabled
)
values (
  '96000000-0000-0000-0000-000000000001',
  false,
  false,
  true
);

insert into public.business_service_categories (business_id, service_category)
values (
  '96000000-0000-0000-0000-000000000001',
  'Plumbing'
);

insert into public.business_service_areas (business_id, service_area)
values (
  '96000000-0000-0000-0000-000000000001',
  'Analyticsville'
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
  status
)
values (
  '96000000-0000-0000-0000-000000000011',
  '10000000-0000-0000-0000-000000000001',
  'Matching plumbing request',
  'A plumbing request that matches the configured service and area.',
  'Plumbing',
  'Plumbing',
  'Auckland',
  'Analyticsville',
  5,
  'open'
);

select is(
  (
    select count(*)
    from public.business_job_lead_matches
    where business_id = '96000000-0000-0000-0000-000000000001'
      and job_request_id = '96000000-0000-0000-0000-000000000011'
  ),
  1::bigint,
  'the existing matching point creates one durable lead match'
);

select is(
  (
    select count(*)
    from public.business_notifications
    where business_id = '96000000-0000-0000-0000-000000000001'
      and related_job_request_id = '96000000-0000-0000-0000-000000000011'
      and notification_type = 'new_lead'
  ),
  1::bigint,
  'the existing new-lead notification is still created'
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
  status
)
values (
  '96000000-0000-0000-0000-000000000012',
  '10000000-0000-0000-0000-000000000001',
  'Non-matching electrical request',
  'An electrical request that must not match the plumbing business.',
  'Electrical',
  'Electrical',
  'Auckland',
  'Analyticsville',
  5,
  'open'
);

select is(
  (
    select count(*)
    from public.business_job_lead_matches
    where business_id = '96000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'the existing category matching rule remains unchanged'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.dismiss_business_notifications(
      '96000000-0000-0000-0000-000000000001'
    )
  $$,
  'business notifications remain dismissible'
);

reset role;

select is(
  (
    select count(*)
    from public.business_job_lead_matches
    where business_id = '96000000-0000-0000-0000-000000000001'
      and job_request_id = '96000000-0000-0000-0000-000000000011'
  ),
  1::bigint,
  'dismissing a notification does not delete the durable analytics event'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select marketplace_matched_leads
    from public.get_business_dashboard_metrics(
      '96000000-0000-0000-0000-000000000001',
      (now() at time zone 'Pacific/Auckland')::date,
      (now() at time zone 'Pacific/Auckland')::date
    )
  ),
  1::bigint,
  'dashboard lead metrics use the durable match rather than notifications'
);

reset role;

select ok(
  not has_table_privilege(
    'authenticated',
    'public.business_job_lead_matches',
    'SELECT'
  ),
  'authenticated users cannot browse customer-level match records directly'
);

select * from finish();
rollback;
