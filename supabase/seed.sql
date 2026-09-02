begin;

-- ============================================================
-- Test authentication accounts
-- Password for every account: LocalLink123!
-- ============================================================

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
select
  '00000000-0000-0000-0000-000000000000',
  user_id,
  'authenticated',
  'authenticated',
  email,
  extensions.crypt('LocalLink123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'first_name', first_name,
    'last_name', last_name
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
from (
  values
    (
      '10000000-0000-0000-0000-000000000001'::uuid,
      'consumer@test.locallink.nz',
      'Casey',
      'Consumer'
    ),
    (
      '20000000-0000-0000-0000-000000000001'::uuid,
      'plumber@test.locallink.nz',
      'Peter',
      'Plumber'
    ),
    (
      '30000000-0000-0000-0000-000000000001'::uuid,
      'electrician@test.locallink.nz',
      'Ella',
      'Electrician'
    )
) as test_users(user_id, email, first_name, last_name);


insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  identity_id,
  user_id,
  user_id::text,
  jsonb_build_object(
    'sub', user_id::text,
    'email', email,
    'email_verified', true
  ),
  'email',
  now(),
  now(),
  now()
from (
  values
    (
      '11000000-0000-0000-0000-000000000001'::uuid,
      '10000000-0000-0000-0000-000000000001'::uuid,
      'consumer@test.locallink.nz'
    ),
    (
      '22000000-0000-0000-0000-000000000001'::uuid,
      '20000000-0000-0000-0000-000000000001'::uuid,
      'plumber@test.locallink.nz'
    ),
    (
      '33000000-0000-0000-0000-000000000001'::uuid,
      '30000000-0000-0000-0000-000000000001'::uuid,
      'electrician@test.locallink.nz'
    )
) as test_identities(identity_id, user_id, email);

-- ============================================================
-- Test businesses
-- ============================================================

insert into public.businesses (
  id,
  business_name,
  description,
  verification_status,
  onboarding_completed_at
)
values
  (
    '21000000-0000-0000-0000-000000000001',
    'Ponsonby Plumbing Test',
    'Seeded plumbing provider for LocalLink development.',
    'verified',
    now()
  ),
  (
    '31000000-0000-0000-0000-000000000001',
    'Auckland Electrical Test',
    'Seeded electrical provider for LocalLink development.',
    'verified',
    now()
  );

insert into public.business_members (
  business_id,
  profile_id,
  role
)
values
  (
    '21000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'owner'
  ),
  (
    '31000000-0000-0000-0000-000000000001',
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
  (
    '21000000-0000-0000-0000-000000000001',
    true,
    false,
    true
  ),
  (
    '31000000-0000-0000-0000-000000000001',
    false,
    false,
    true
  );

insert into public.business_locations (
  id,
  business_id,
  name,
  formatted_address,
  address_line1,
  suburb,
  city,
  postcode,
  country_code,
  location,
  is_primary
)
values
  (
    '21100000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    'Ponsonby workshop',
    'Ponsonby Road, Ponsonby, Auckland 1011, New Zealand',
    'Ponsonby Road',
    'Ponsonby',
    'Auckland',
    '1011',
    'nz',
    extensions.st_setsrid(extensions.st_makepoint(174.745, -36.8545), 4326)::extensions.geography,
    true
  ),
  (
    '21100000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000001',
    'Auckland CBD',
    'Queen Street, Auckland Central, Auckland 1010, New Zealand',
    'Queen Street',
    'Auckland Central',
    'Auckland',
    '1010',
    'nz',
    extensions.st_setsrid(extensions.st_makepoint(174.7633, -36.8485), 4326)::extensions.geography,
    false
  ),
  (
    '31100000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001',
    'Newmarket office',
    'Broadway, Newmarket, Auckland 1023, New Zealand',
    'Broadway',
    'Newmarket',
    'Auckland',
    '1023',
    'nz',
    extensions.st_setsrid(extensions.st_makepoint(174.778, -36.869), 4326)::extensions.geography,
    true
  );

insert into public.business_service_profiles (
  business_id,
  service_description,
  availability
)
values
  (
    '21000000-0000-0000-0000-000000000001',
    'Residential plumbing repairs and installations.',
    'Monday to Friday, 8:00 AM to 5:00 PM'
  ),
  (
    '31000000-0000-0000-0000-000000000001',
    'Residential electrical repairs and installations.',
    'Monday to Saturday, 8:00 AM to 6:00 PM'
  );

insert into public.business_service_categories (
  business_id,
  service_category
)
values
  (
    '21000000-0000-0000-0000-000000000001',
    'Plumbing'
  ),
  (
    '31000000-0000-0000-0000-000000000001',
    'Electrical'
  );

insert into public.business_service_areas (
  business_id,
  service_area
)
values
  (
    '21000000-0000-0000-0000-000000000001',
    'Ponsonby'
  ),
  (
    '21000000-0000-0000-0000-000000000001',
    'Auckland'
  ),
  (
    '31000000-0000-0000-0000-000000000001',
    'Ponsonby'
  ),
  (
    '31000000-0000-0000-0000-000000000001',
    'Auckland'
  );

-- Give the seeded consumer an approved full address so accepted-job contact
-- sharing can be exercised in both portals. It is never returned for leads or
-- unaccepted quotes.
update public.profiles
set
  formatted_address = '12 Franklin Road, Ponsonby, Auckland 1011, New Zealand',
  address_line1 = '12 Franklin Road',
  suburb = 'Ponsonby',
  city = 'Auckland',
  postcode = '1011',
  country_code = 'nz'
where id = '10000000-0000-0000-0000-000000000001';

-- ============================================================
-- Consumer job requests
-- ============================================================

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
  urgency,
  quote_deadline,
  max_quotes,
  status,
  created_at,
  updated_at
)
values
  -- Available plumbing leads: 001-003 and 007-011.
  (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Repair leaking kitchen tap',
    'The kitchen tap has been leaking continuously and needs repair.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Ponsonby',
    5,
    'Normal',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '1 hour',
    now() - interval '1 hour'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Replace bathroom shower head',
    'The existing shower head is damaged and needs to be replaced.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Grey Lynn',
    5,
    'Flexible',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '2 hours',
    now() - interval '2 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Fix blocked bathroom sink',
    'The bathroom sink drains very slowly and may have a blockage.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Ponsonby',
    3,
    'Urgent',
    now() + interval '36 hours',
    3,
    'open',
    now() - interval '3 hours',
    now() - interval '3 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Install a new power outlet',
    'A new electrical power outlet is needed in the home office.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Ponsonby',
    5,
    'Urgent',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '4 hours',
    now() - interval '4 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    'Repair leaking outdoor pipe',
    'An outdoor water pipe is leaking and requires urgent repair.',
    'Plumbing',
    'Plumbing',
    'Hamilton',
    'Frankton',
    5,
    'Urgent',
    now() + interval '2 days',
    3,
    'open',
    now() - interval '5 hours',
    now() - interval '5 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000001',
    'Replace old kitchen pipes',
    'Several old kitchen pipes need to be inspected and replaced.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Ponsonby',
    5,
    'Flexible',
    now() + interval '3 days',
    3,
    'closed',
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    '40000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000001',
    'Urgent burst pipe in laundry',
    'Water is pooling beneath the washing machine valves from a burst pipe.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Ponsonby',
    2,
    'Urgent',
    now() + interval '12 hours',
    3,
    'open',
    now() - interval '20 minutes',
    now() - interval '20 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000001',
    'Install dishwasher water connection',
    'Our renovated kitchen needs a cold water inlet and waste connection.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Mount Eden',
    7,
    'Normal',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '6 hours',
    now() - interval '6 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000001',
    'Investigate low hot water pressure',
    'The shower pressure drops whenever the hot water cylinder is running.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Newmarket',
    4,
    'Urgent',
    now() + interval '60 hours',
    3,
    'open',
    now() - interval '8 hours',
    now() - interval '8 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000001',
    'Move laundry plumbing for renovation',
    'Relocate the washing machine taps and drain to the opposite wall.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Onehunga',
    8,
    'Normal',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '12 hours',
    now() - interval '12 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000001',
    'Replace cracked toilet cistern',
    'The porcelain cistern is cracked and slowly leaking onto the floor.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Takapuna',
    6,
    'Urgent',
    now() + interval '40 hours',
    3,
    'open',
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  -- Available electrical leads: 004 and 012-018.
  (
    '40000000-0000-0000-0000-000000000012',
    '10000000-0000-0000-0000-000000000001',
    'Repair flickering hallway lights',
    'Several hallway lights flicker intermittently and make a buzzing sound.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Grey Lynn',
    3,
    'Urgent',
    now() + interval '10 hours',
    3,
    'open',
    now() - interval '30 minutes',
    now() - interval '30 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000013',
    '10000000-0000-0000-0000-000000000001',
    'Upgrade old switchboard and safety switches',
    'Replace porcelain fuses and add modern residual current protection.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Mount Eden',
    5,
    'Normal',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '5 hours',
    now() - interval '5 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000014',
    '10000000-0000-0000-0000-000000000001',
    'Install EV charger in garage',
    'Install a wall-mounted electric vehicle charger beside the main garage door.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Newmarket',
    10,
    'Normal',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '7 hours',
    now() - interval '7 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000015',
    '10000000-0000-0000-0000-000000000001',
    'Add outdoor security lighting',
    'Fit motion sensor lights above the driveway and back entrance.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Takapuna',
    7,
    'Normal',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '10 hours',
    now() - interval '10 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000016',
    '10000000-0000-0000-0000-000000000001',
    'Diagnose oven circuit tripping',
    'The breaker trips whenever the electric oven reaches a high temperature.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Onehunga',
    4,
    'Urgent',
    now() + interval '30 hours',
    3,
    'open',
    now() - interval '14 hours',
    now() - interval '14 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000017',
    '10000000-0000-0000-0000-000000000001',
    'Wire ceiling fan in bedroom',
    'Replace the existing ceiling light with a fan and separate wall controls.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Parnell',
    3,
    'Flexible',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '18 hours',
    now() - interval '18 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000018',
    '10000000-0000-0000-0000-000000000001',
    'Add data and power outlets to office',
    'Run ethernet cabling and install two double power outlets for desks.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Ponsonby',
    5,
    'Normal',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '22 hours',
    now() - interval '22 hours'
  ),
  -- Excluded examples for availability and automatic matching checks.
  (
    '40000000-0000-0000-0000-000000000019',
    '10000000-0000-0000-0000-000000000001',
    'Expired leaking hot water cylinder',
    'The cylinder overflow has been leaking and the quote period has ended.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Ponsonby',
    5,
    'Urgent',
    now() - interval '1 hour',
    3,
    'open',
    now() - interval '3 days',
    now() - interval '3 days'
  ),
  (
    '40000000-0000-0000-0000-000000000020',
    '10000000-0000-0000-0000-000000000001',
    'Replace damaged bathroom extractor fan',
    'The extractor motor has failed and the room is collecting condensation.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Ponsonby',
    4,
    'Normal',
    now() + interval '4 days',
    1,
    'open',
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  (
    '40000000-0000-0000-0000-000000000021',
    '10000000-0000-0000-0000-000000000001',
    'Accepted quote for bathroom renovation plumbing',
    'Install new shower, vanity, and toilet plumbing for a bathroom renovation.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Grey Lynn',
    5,
    'Normal',
    now() + interval '3 days',
    3,
    'in_progress',
    now() - interval '4 days',
    now() - interval '1 day'
  ),
  (
    '40000000-0000-0000-0000-000000000022',
    '10000000-0000-0000-0000-000000000001',
    'Build custom garage shelving',
    'Construct floor-to-ceiling timber storage shelves along the garage wall.',
    'Carpentry',
    'Carpentry',
    'Auckland',
    'Ponsonby',
    5,
    'Normal',
    now() + interval '3 days',
    3,
    'open',
    now() - interval '2 hours',
    now() - interval '2 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000023',
    '10000000-0000-0000-0000-000000000001',
    'Cancelled garden lighting installation',
    'Install low voltage path lighting around the front garden beds.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Ponsonby',
    5,
    'Normal',
    now() + interval '3 days',
    3,
    'cancelled',
    now() - interval '3 days',
    now() - interval '1 day'
  ),
  (
    '40000000-0000-0000-0000-000000000024',
    '10000000-0000-0000-0000-000000000001',
    'Accepted quote for kitchen rewiring',
    'Rewire the renovated kitchen and connect the new cooking appliances.',
    'Electrical',
    'Electrical',
    'Auckland',
    'Mount Eden',
    5,
    'Normal',
    now() + interval '3 days',
    3,
    'in_progress',
    now() - interval '5 days',
    now() - interval '1 day'
  );

-- Existing quotes exercise update-quote, fully quoted, and active job states.

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
values
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000003',
    '21000000-0000-0000-0000-000000000001',
    'fixed',
    18500,
    current_date + 1,
    '8:00-10:00 AM',
    'Inspection, labour, and standard repair materials.',
    'Replacement parts beyond standard materials require approval.',
    'Around 2 hours',
    'I can inspect and repair the blocked sink tomorrow morning.',
    'awaiting_response',
    now() - interval '30 minutes',
    now() - interval '30 minutes'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000014',
    '31000000-0000-0000-0000-000000000001',
    'fixed',
    149900,
    current_date + 5,
    '9:00-11:00 AM',
    'Site inspection, compliant wiring, charger installation, and testing.',
    'Quote assumes the existing switchboard has sufficient capacity.',
    'One working day',
    'I can inspect the switchboard and install the EV charger next week.',
    'awaiting_response',
    now() - interval '2 hours',
    now() - interval '2 hours'
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000020',
    '31000000-0000-0000-0000-000000000001',
    'fixed',
    32500,
    current_date + 2,
    '1:00-3:00 PM',
    'Supply and installation of a standard extractor fan.',
    'Any ducting repairs will be discussed before work begins.',
    'Around 3 hours',
    'I can supply and install a replacement extractor fan this week.',
    'awaiting_response',
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    '40000000-0000-0000-0000-000000000021',
    '21000000-0000-0000-0000-000000000001',
    'fixed',
    285000,
    current_date + 1,
    '8:00-9:00 AM',
    'Bathroom plumbing installation described in the request.',
    'Customer-supplied fixtures must be onsite before arrival.',
    'Three working days',
    'The bathroom plumbing work is booked and ready to begin.',
    'accepted',
    now() - interval '2 days',
    now() - interval '1 day'
  ),
  (
    '50000000-0000-0000-0000-000000000005',
    '40000000-0000-0000-0000-000000000024',
    '31000000-0000-0000-0000-000000000001',
    'fixed',
    420000,
    current_date + 1,
    '7:30-8:30 AM',
    'Kitchen rewiring, appliance connections, testing, and certification.',
    'Access to the switchboard and kitchen is required.',
    'Four working days',
    'The kitchen rewiring has been accepted and is ready to schedule.',
    'accepted',
    now() - interval '2 days',
    now() - interval '1 day'
  );

-- Local-development helper for exercising the real deadline reminder flow
-- from the notification dropdown. Seed files are not deployed by db push.
create or replace function public.create_seed_quote_deadline_reminder(
  p_business_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
set timezone = 'Pacific/Auckland'
as $$
declare
  v_quote_id uuid;
  v_threshold timestamptz := now();
  v_submitted_at timestamptz;
  v_days_subtracted integer := 0;
begin
  if p_business_id not in (
    '21000000-0000-0000-0000-000000000001'::uuid,
    '31000000-0000-0000-0000-000000000001'::uuid
  ) or not public.is_business_member(p_business_id) then
    raise exception 'Deadline notification testing is limited to seeded businesses'
      using errcode = '42501';
  end if;

  select quote.id into v_quote_id
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.business_id = p_business_id
    and quote.status = 'awaiting_response'
    and job.status = 'open'
  order by quote.created_at
  limit 1;

  if v_quote_id is null then
    raise exception 'No awaiting-response seed quote is available';
  end if;

  while not (extract(isodow from v_threshold) between 1 and 5) loop
    v_threshold := v_threshold - interval '1 day';
  end loop;

  v_submitted_at := v_threshold;
  while v_days_subtracted < 2 loop
    v_submitted_at := v_submitted_at - interval '1 day';
    if extract(isodow from v_submitted_at) between 1 and 5 then
      v_days_subtracted := v_days_subtracted + 1;
    end if;
  end loop;

  delete from public.business_notifications
  where related_quote_id = v_quote_id
    and notification_type = 'quote_deadline_reminder';

  update public.job_quotes
  set created_at = v_submitted_at
  where id = v_quote_id;

  perform public.create_due_quote_deadline_notifications(now());

  return exists (
    select 1
    from public.business_notifications
    where related_quote_id = v_quote_id
      and notification_type = 'quote_deadline_reminder'
  );
end;
$$;

revoke all on function public.create_seed_quote_deadline_reminder(uuid) from public;
grant execute on function public.create_seed_quote_deadline_reminder(uuid) to authenticated;

commit;
