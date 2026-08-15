begin;

select plan(25);

select is(
  (select count(*)::integer from cron.job where jobname = 'create-due-quote-deadline-notifications-hourly'),
  1,
  'the hourly quote deadline reminder job is scheduled once'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;
select is(
  public.create_seed_quote_deadline_reminder(
    '21000000-0000-0000-0000-000000000001'
  ),
  true,
  'the seeded provider can generate a reminder through the in-app test RPC'
);
select is(
  (
    select related_job_request_id is not null
    from public.get_business_notifications(
      '21000000-0000-0000-0000-000000000001'
    )
    where notification_type = 'quote_deadline_reminder'
    limit 1
  ),
  true,
  'deadline reminder results expose the related job for deep linking'
);
select is(
  (
    select related_quote_id is not null
    from public.get_business_notifications(
      '21000000-0000-0000-0000-000000000001'
    )
    where notification_type = 'quote_deadline_reminder'
    limit 1
  ),
  true,
  'deadline reminder results expose the related quote for deep linking'
);
select cmp_ok(
  public.dismiss_business_notifications(
    '21000000-0000-0000-0000-000000000001'
  ),
  '>',
  0,
  'a seeded provider can dismiss all notifications for their business'
);
select is(
  (
    select count(*)::integer
    from public.business_notifications
    where business_id = '21000000-0000-0000-0000-000000000001'
  ),
  0,
  'dismiss all removes the business notification history'
);
reset role;

-- Keep function return counts deterministic when the local database was
-- started with seed data. This deletion is contained by the test transaction.
delete from public.job_quotes;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000',
  '94000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'deadline-reminder-test@locallink.test',
  '',
  '2026-08-01 09:00:00+12',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"first_name":"Deadline","last_name":"Test"}'::jsonb,
  '2026-08-01 09:00:00+12',
  '2026-08-01 09:00:00+12',
  '',
  '',
  '',
  ''
);

insert into public.businesses (id, business_name, description)
values (
  '93000000-0000-0000-0000-000000000001',
  'Deadline Reminder Test Business',
  'Business fixture for quote deadline reminder database tests.'
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
    '91000000-0000-0000-0000-000000000001',
    '94000000-0000-0000-0000-000000000001',
    'Weekday threshold quote',
    'Test job for the exact weekday reminder threshold.',
    'Plumbing', 'Plumbing', 'Auckland', 'Ponsonby', 5, 'open',
    '2026-08-10 09:00:00+12', '2026-08-10 09:00:00+12'
  ),
  (
    '91000000-0000-0000-0000-000000000002',
    '94000000-0000-0000-0000-000000000001',
    'Weekend threshold quote',
    'Test job whose reminder threshold crosses a weekend.',
    'Plumbing', 'Plumbing', 'Auckland', 'Ponsonby', 5, 'open',
    '2026-08-13 09:00:00+12', '2026-08-13 09:00:00+12'
  ),
  (
    '91000000-0000-0000-0000-000000000003',
    '94000000-0000-0000-0000-000000000001',
    'Accepted quote',
    'Test job with an accepted quote that must not be reminded.',
    'Plumbing', 'Plumbing', 'Auckland', 'Ponsonby', 5, 'open',
    '2026-08-10 09:00:00+12', '2026-08-10 09:00:00+12'
  ),
  (
    '91000000-0000-0000-0000-000000000004',
    '94000000-0000-0000-0000-000000000001',
    'Rejected quote',
    'Test job with a rejected quote that must not be reminded.',
    'Plumbing', 'Plumbing', 'Auckland', 'Ponsonby', 5, 'open',
    '2026-08-10 09:00:00+12', '2026-08-10 09:00:00+12'
  ),
  (
    '91000000-0000-0000-0000-000000000005',
    '94000000-0000-0000-0000-000000000001',
    'Withdrawn quote',
    'Test job with a withdrawn quote that must not be reminded.',
    'Plumbing', 'Plumbing', 'Auckland', 'Ponsonby', 5, 'open',
    '2026-08-10 09:00:00+12', '2026-08-10 09:00:00+12'
  ),
  (
    '91000000-0000-0000-0000-000000000006',
    '94000000-0000-0000-0000-000000000001',
    'Expired quote',
    'Test job with an expired response period that must not be reminded.',
    'Plumbing', 'Plumbing', 'Auckland', 'Ponsonby', 5, 'open',
    '2026-08-03 09:00:00+12', '2026-08-03 09:00:00+12'
  ),
  (
    '91000000-0000-0000-0000-000000000007',
    '94000000-0000-0000-0000-000000000001',
    'Cancelled request quote',
    'Test job cancelled by the customer that must not be reminded.',
    'Plumbing', 'Plumbing', 'Auckland', 'Ponsonby', 5, 'cancelled',
    '2026-08-10 09:00:00+12', '2026-08-10 09:00:00+12'
  ),
  (
    '91000000-0000-0000-0000-000000000008',
    '94000000-0000-0000-0000-000000000001',
    'Delayed scheduler quote',
    'Test job proving a delayed scheduler run still creates a reminder.',
    'Plumbing', 'Plumbing', 'Auckland', 'Ponsonby', 5, 'open',
    '2026-08-10 11:00:00+12', '2026-08-10 11:00:00+12'
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
select
  quote_id,
  job_id,
  '93000000-0000-0000-0000-000000000001',
  'fixed',
  25000,
  '2026-08-24'::date,
  '9:00-11:00 AM',
  'Labour and standard materials.',
  'Additional materials require customer approval.',
  'Two hours',
  'Database test quote for deadline reminder behaviour.',
  quote_status,
  submitted_at,
  submitted_at
from (
  values
    ('92000000-0000-0000-0000-000000000001'::uuid, '91000000-0000-0000-0000-000000000001'::uuid, 'awaiting_response', '2026-08-10 09:00:00+12'::timestamptz),
    ('92000000-0000-0000-0000-000000000002'::uuid, '91000000-0000-0000-0000-000000000002'::uuid, 'awaiting_response', '2026-08-13 09:00:00+12'::timestamptz),
    ('92000000-0000-0000-0000-000000000003'::uuid, '91000000-0000-0000-0000-000000000003'::uuid, 'accepted', '2026-08-10 09:00:00+12'::timestamptz),
    ('92000000-0000-0000-0000-000000000004'::uuid, '91000000-0000-0000-0000-000000000004'::uuid, 'rejected', '2026-08-10 09:00:00+12'::timestamptz),
    ('92000000-0000-0000-0000-000000000005'::uuid, '91000000-0000-0000-0000-000000000005'::uuid, 'withdrawn', '2026-08-10 09:00:00+12'::timestamptz),
    ('92000000-0000-0000-0000-000000000006'::uuid, '91000000-0000-0000-0000-000000000006'::uuid, 'awaiting_response', '2026-08-03 09:00:00+12'::timestamptz),
    ('92000000-0000-0000-0000-000000000007'::uuid, '91000000-0000-0000-0000-000000000007'::uuid, 'awaiting_response', '2026-08-10 09:00:00+12'::timestamptz),
    ('92000000-0000-0000-0000-000000000008'::uuid, '91000000-0000-0000-0000-000000000008'::uuid, 'awaiting_response', '2026-08-10 11:00:00+12'::timestamptz)
) as fixture(quote_id, job_id, quote_status, submitted_at);

select is(
  public.create_due_quote_deadline_notifications('2026-08-12 08:59:59+12'),
  0,
  'no reminder is created before the three-working-days-remaining threshold'
);

select is(
  public.create_due_quote_deadline_notifications('2026-08-12 09:00:00+12'),
  1,
  'one reminder is created exactly at the threshold'
);

select is(
  (select count(*)::integer from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000001' and notification_type = 'quote_deadline_reminder'),
  1,
  'the threshold quote has exactly one reminder'
);

select is(
  public.create_due_quote_deadline_notifications('2026-08-12 09:00:00+12'),
  0,
  'running the reminder function again creates nothing'
);

select is(
  (select count(*)::integer from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000001' and notification_type = 'quote_deadline_reminder'),
  1,
  'the unique reminder remains after a repeated run'
);

select is(
  public.create_due_quote_deadline_notifications('2026-08-12 10:59:59+12'),
  0,
  'a later-created quote is still excluded one second before its threshold'
);

select is(
  public.create_due_quote_deadline_notifications('2026-08-13 12:00:00+12'),
  1,
  'a delayed scheduler run catches a quote after its threshold'
);

select is(
  (select count(*)::integer from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000008' and notification_type = 'quote_deadline_reminder'),
  1,
  'the delayed quote receives exactly one reminder'
);

select is(
  public.create_due_quote_deadline_notifications('2026-08-17 08:59:59+12'),
  0,
  'a Thursday quote is not due before its Monday threshold'
);

select is(
  public.create_due_quote_deadline_notifications('2026-08-17 09:00:00+12'),
  1,
  'the weekend-crossing threshold is calculated correctly'
);

select is(
  (select count(*)::integer from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000002' and notification_type = 'quote_deadline_reminder'),
  1,
  'the weekend-crossing quote receives exactly one reminder'
);

select is(
  (select count(*)::integer from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000003' and notification_type = 'quote_deadline_reminder'),
  0,
  'accepted quotes receive no reminder'
);

select is(
  (select count(*)::integer from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000004' and notification_type = 'quote_deadline_reminder'),
  0,
  'rejected quotes receive no reminder'
);

select is(
  (select count(*)::integer from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000005' and notification_type = 'quote_deadline_reminder'),
  0,
  'withdrawn quotes receive no reminder'
);

select is(
  (select count(*)::integer from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000006' and notification_type = 'quote_deadline_reminder'),
  0,
  'expired awaiting-response quotes receive no reminder'
);

select is(
  (select count(*)::integer from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000007' and notification_type = 'quote_deadline_reminder'),
  0,
  'quotes for cancelled requests receive no reminder'
);

select is(
  (select count(*)::integer from public.business_notifications where notification_type = 'quote_deadline_reminder' and related_quote_id between '92000000-0000-0000-0000-000000000001' and '92000000-0000-0000-0000-000000000008'),
  3,
  'only the three eligible fixture quotes receive reminders'
);

select is(
  (select created_at from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000001' and notification_type = 'quote_deadline_reminder'),
  '2026-08-12 09:00:00+12'::timestamptz,
  'the supplied current time is stored as the reminder creation time'
);

select is(
  (select destination from public.business_notifications where related_quote_id = '92000000-0000-0000-0000-000000000001' and notification_type = 'quote_deadline_reminder'),
  '/business/services?tab=quotes',
  'the reminder links to business quote tracking'
);

select * from finish();
rollback;
