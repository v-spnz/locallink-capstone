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
    ),
    (
      '40000000-0000-0000-0000-000000000001'::uuid,
      'cafe@test.locallink.nz',
      'Cameron',
      'Cafe'
    ),
    (
      '50000000-0000-0000-0000-000000000001'::uuid,
      'florist@test.locallink.nz',
      'Fiona',
      'Florist'
    ),
    (
      '60000000-0000-0000-0000-000000000001'::uuid,
      'homeservices@test.locallink.nz',
      'Harper',
      'Builder'
    ),
    (
      '70000000-0000-0000-0000-000000000001'::uuid,
      'member@test.locallink.nz',
      'Mia',
      'Member'
    ),
    (
      '80000000-0000-0000-0000-000000000001'::uuid,
      'staff@test.locallink.nz',
      'Sam',
      'Staff'
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
    ),
    (
      '44000000-0000-0000-0000-000000000001'::uuid,
      '40000000-0000-0000-0000-000000000001'::uuid,
      'cafe@test.locallink.nz'
    ),
    (
      '55000000-0000-0000-0000-000000000001'::uuid,
      '50000000-0000-0000-0000-000000000001'::uuid,
      'florist@test.locallink.nz'
    ),
    (
      '66000000-0000-0000-0000-000000000001'::uuid,
      '60000000-0000-0000-0000-000000000001'::uuid,
      'homeservices@test.locallink.nz'
    ),
    (
      '77000000-0000-0000-0000-000000000001'::uuid,
      '70000000-0000-0000-0000-000000000001'::uuid,
      'member@test.locallink.nz'
    ),
    (
      '88000000-0000-0000-0000-000000000001'::uuid,
      '80000000-0000-0000-0000-000000000001'::uuid,
      'staff@test.locallink.nz'
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
  ),
  (
    '41000000-0000-0000-0000-000000000001',
    'Neighbourhood Coffee House',
    'Ponsonby cafe with local deals and a customer loyalty programme.',
    'not_required',
    now()
  ),
  (
    '51000000-0000-0000-0000-000000000001',
    'Grey Lynn Flower Studio',
    'Independent florist offering seasonal bouquets and local pickup deals.',
    'not_required',
    now()
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Harbour Home and Garden',
    'Verified home maintenance provider for carpentry, painting, landscaping, and roofing work.',
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
  ),
  (
    '41000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'owner'
  ),
  (
    '51000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'owner'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    'owner'
  ),
  (
    '21000000-0000-0000-0000-000000000001',
    '80000000-0000-0000-0000-000000000001',
    'admin'
  ),
  (
    '41000000-0000-0000-0000-000000000001',
    '80000000-0000-0000-0000-000000000001',
    'staff'
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
  ),
  (
    '41000000-0000-0000-0000-000000000001',
    true,
    true,
    false
  ),
  (
    '51000000-0000-0000-0000-000000000001',
    true,
    true,
    false
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    true,
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
  ),
  (
    '41100000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001',
    'Ponsonby cafe',
    '142 Ponsonby Road, Ponsonby, Auckland 1011, New Zealand',
    '142 Ponsonby Road',
    'Ponsonby',
    'Auckland',
    '1011',
    'nz',
    extensions.st_setsrid(extensions.st_makepoint(174.7462, -36.8560), 4326)::extensions.geography,
    true
  ),
  (
    '51100000-0000-0000-0000-000000000001',
    '51000000-0000-0000-0000-000000000001',
    'Grey Lynn studio',
    '18 Williamson Avenue, Grey Lynn, Auckland 1021, New Zealand',
    '18 Williamson Avenue',
    'Grey Lynn',
    'Auckland',
    '1021',
    'nz',
    extensions.st_setsrid(extensions.st_makepoint(174.7377, -36.8584), 4326)::extensions.geography,
    true
  ),
  (
    '61100000-0000-0000-0000-000000000001',
    '61000000-0000-0000-0000-000000000001',
    'Takapuna workshop',
    '48 Barrys Point Road, Takapuna, Auckland 0622, New Zealand',
    '48 Barrys Point Road',
    'Takapuna',
    'Auckland',
    '0622',
    'nz',
    extensions.st_setsrid(extensions.st_makepoint(174.7660, -36.7915), 4326)::extensions.geography,
    true
  ),
  (
    '61100000-0000-0000-0000-000000000002',
    '61000000-0000-0000-0000-000000000001',
    'Mount Eden office',
    '286 Mount Eden Road, Mount Eden, Auckland 1024, New Zealand',
    '286 Mount Eden Road',
    'Mount Eden',
    'Auckland',
    '1024',
    'nz',
    extensions.st_setsrid(extensions.st_makepoint(174.7615, -36.8770), 4326)::extensions.geography,
    false
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
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Home maintenance, renovation, painting, landscaping, carpentry, and roofing services.',
    'Monday to Saturday, 7:30 AM to 5:30 PM; emergency roof callouts available'
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
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Carpentry'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Painting'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Landscaping'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Roofing'
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
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Ponsonby'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Grey Lynn'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Mount Eden'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Takapuna'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'Auckland'
  );

-- Give every seeded account a complete location profile. Customer contact
-- details are returned only after a quote is accepted.
update public.profiles
set
  formatted_address = seeded_profile.formatted_address,
  address_line1 = seeded_profile.address_line1,
  suburb = seeded_profile.suburb,
  city = seeded_profile.city,
  postcode = seeded_profile.postcode,
  country_code = 'nz',
  location = extensions.st_setsrid(
    extensions.st_makepoint(seeded_profile.longitude, seeded_profile.latitude),
    4326
  )::extensions.geography
from (
  values
    (
      '10000000-0000-0000-0000-000000000001'::uuid,
      '12 Franklin Road, Ponsonby, Auckland 1011, New Zealand',
      '12 Franklin Road', 'Ponsonby', 'Auckland', '1011',
      174.7465::double precision, -36.8551::double precision
    ),
    (
      '20000000-0000-0000-0000-000000000001'::uuid,
      '20 Ponsonby Road, Ponsonby, Auckland 1011, New Zealand',
      '20 Ponsonby Road', 'Ponsonby', 'Auckland', '1011',
      174.7476::double precision, -36.8580::double precision
    ),
    (
      '30000000-0000-0000-0000-000000000001'::uuid,
      '15 Broadway, Newmarket, Auckland 1023, New Zealand',
      '15 Broadway', 'Newmarket', 'Auckland', '1023',
      174.7784::double precision, -36.8682::double precision
    ),
    (
      '40000000-0000-0000-0000-000000000001'::uuid,
      '142 Ponsonby Road, Ponsonby, Auckland 1011, New Zealand',
      '142 Ponsonby Road', 'Ponsonby', 'Auckland', '1011',
      174.7462::double precision, -36.8560::double precision
    ),
    (
      '50000000-0000-0000-0000-000000000001'::uuid,
      '18 Williamson Avenue, Grey Lynn, Auckland 1021, New Zealand',
      '18 Williamson Avenue', 'Grey Lynn', 'Auckland', '1021',
      174.7377::double precision, -36.8584::double precision
    ),
    (
      '60000000-0000-0000-0000-000000000001'::uuid,
      '48 Barrys Point Road, Takapuna, Auckland 0622, New Zealand',
      '48 Barrys Point Road', 'Takapuna', 'Auckland', '0622',
      174.7660::double precision, -36.7915::double precision
    ),
    (
      '70000000-0000-0000-0000-000000000001'::uuid,
      '32 Richmond Road, Grey Lynn, Auckland 1021, New Zealand',
      '32 Richmond Road', 'Grey Lynn', 'Auckland', '1021',
      174.7402::double precision, -36.8589::double precision
    ),
    (
      '80000000-0000-0000-0000-000000000001'::uuid,
      '8 Jervois Road, Ponsonby, Auckland 1011, New Zealand',
      '8 Jervois Road', 'Ponsonby', 'Auckland', '1011',
      174.7420::double precision, -36.8502::double precision
    )
) as seeded_profile(
  id,
  formatted_address,
  address_line1,
  suburb,
  city,
  postcode,
  longitude,
  latitude
)
where public.profiles.id = seeded_profile.id;

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
    'Completed bathroom renovation plumbing',
    'Install new shower, vanity, and toilet plumbing for a bathroom renovation.',
    'Plumbing',
    'Plumbing',
    'Auckland',
    'Grey Lynn',
    5,
    'Normal',
    now() - interval '40 days',
    3,
    'completed',
    now() - interval '45 days',
    now() - interval '30 days'
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

-- Additional category coverage for the multi-service home provider.
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
  (
    '40000000-0000-0000-0000-000000000025',
    '70000000-0000-0000-0000-000000000001',
    'Paint two bedrooms and hallway',
    'Prepare and repaint two bedrooms and the upstairs hallway in warm neutral colours.',
    'Painting',
    'Painting',
    'Auckland',
    'Grey Lynn',
    6,
    'Flexible',
    now() + interval '4 days',
    3,
    'open',
    now() - interval '3 hours',
    now() - interval '3 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000026',
    '70000000-0000-0000-0000-000000000001',
    'Landscape compact back garden',
    'Create a low-maintenance planting plan and install raised garden edging.',
    'Landscaping',
    'Landscaping',
    'Auckland',
    'Mount Eden',
    8,
    'Normal',
    now() + interval '4 days',
    3,
    'open',
    now() - interval '5 hours',
    now() - interval '5 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000027',
    '70000000-0000-0000-0000-000000000001',
    'Repair leaking garage roof',
    'Inspect the garage roof, replace damaged sheets, and reseal the flashing.',
    'Roofing',
    'Roofing',
    'Auckland',
    'Takapuna',
    10,
    'Urgent',
    now() + interval '2 days',
    3,
    'open',
    now() - interval '45 minutes',
    now() - interval '45 minutes'
  );

-- Every seeded request includes the optional posting details used by the
-- customer and provider views. The image paths are served by Vite locally.
update public.job_requests
set
  image_urls = array['/src/assets/images/local-neighbourhood-street.jpg'],
  job_date = case
    when status in ('in_progress', 'completed', 'closed', 'cancelled')
      then current_date - 1
    else current_date + 7
  end,
  budget = case category
    when 'Plumbing' then '$150 - $750'
    when 'Electrical' then '$250 - $1,500'
    when 'Carpentry' then '$500 - $2,500'
    when 'Painting' then '$800 - $3,000'
    when 'Landscaping' then '$600 - $2,500'
    when 'Roofing' then '$500 - $4,000'
  end
where id::text like '40000000-0000-0000-0000-0000000000%';

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
    current_date - 38,
    '8:00-9:00 AM',
    'Bathroom plumbing installation described in the request.',
    'Customer-supplied fixtures must be onsite before arrival.',
    'Three working days',
    'The bathroom plumbing work is booked and ready to begin.',
    'accepted',
    now() - interval '40 days',
    now() - interval '39 days'
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
  ),
  (
    '50000000-0000-0000-0000-000000000006',
    '40000000-0000-0000-0000-000000000025',
    '61000000-0000-0000-0000-000000000001',
    'fixed',
    185000,
    current_date + 7,
    '8:00-9:30 AM',
    'Surface preparation, two coats of paint, labour, and cleanup.',
    'Customer chooses colours from the standard interior range.',
    'Three working days',
    'We can complete the bedrooms and hallway with low-odour interior paint.',
    'awaiting_response',
    now() - interval '1 hour',
    now() - interval '1 hour'
  ),
  (
    '50000000-0000-0000-0000-000000000007',
    '40000000-0000-0000-0000-000000000022',
    '61000000-0000-0000-0000-000000000001',
    'hourly',
    9500,
    current_date + 6,
    '10:00 AM-12:00 PM',
    'Carpentry labour, measurements, cutting, assembly, and installation.',
    'Timber and specialist hardware are charged separately with approval.',
    'Two to three working days',
    'Our carpenter can build the shelving to the garage dimensions.',
    'rejected',
    now() - interval '1 day',
    now() - interval '12 hours'
  ),
  (
    '50000000-0000-0000-0000-000000000008',
    '40000000-0000-0000-0000-000000000026',
    '61000000-0000-0000-0000-000000000001',
    'call_out',
    12000,
    current_date + 4,
    '2:00-4:00 PM',
    'Site consultation, measurements, and a detailed planting proposal.',
    'Materials and installation are quoted after the site consultation.',
    'Around 90 minutes',
    'We can assess the garden and prepare a practical planting plan.',
    'withdrawn',
    now() - interval '8 hours',
    now() - interval '4 hours'
  );

-- ============================================================
-- Job lifecycle, notification, and loyalty history
-- ============================================================

-- Requests seeded directly in a later lifecycle state did not pass through
-- the open-request trigger, so record their original durable matches here.
insert into public.business_job_lead_matches (
  business_id,
  job_request_id,
  matched_at
)
values
  (
    '21000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000021',
    now() - interval '44 days'
  ),
  (
    '31000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000024',
    now() - interval '5 days'
  )
on conflict (business_id, job_request_id) do nothing;

insert into public.job_status_history (job_request_id, status, updated_at)
values
  ('40000000-0000-0000-0000-000000000021', 'accepted', now() - interval '39 days'),
  ('40000000-0000-0000-0000-000000000021', 'scheduled', now() - interval '37 days'),
  ('40000000-0000-0000-0000-000000000021', 'on_the_way', now() - interval '35 days'),
  ('40000000-0000-0000-0000-000000000021', 'in_progress', now() - interval '34 days'),
  ('40000000-0000-0000-0000-000000000021', 'pending_completion', now() - interval '31 days'),
  ('40000000-0000-0000-0000-000000000021', 'completed', now() - interval '30 days'),
  ('40000000-0000-0000-0000-000000000024', 'accepted', now() - interval '4 days'),
  ('40000000-0000-0000-0000-000000000024', 'scheduled', now() - interval '3 days'),
  ('40000000-0000-0000-0000-000000000024', 'on_the_way', now() - interval '1 day 6 hours'),
  ('40000000-0000-0000-0000-000000000024', 'in_progress', now() - interval '1 day');

insert into public.business_job_opportunity_declines (
  business_id,
  job_request_id,
  declined_at
)
values
  (
    '21000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    now() - interval '6 hours'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000027',
    now() - interval '20 minutes'
  );

insert into public.reward_redemptions (
  id,
  user_id,
  mock_programme_id,
  redeemed_at
)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    4,
    now() - interval '8 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000001',
    5,
    now() - interval '3 days'
  );

-- ============================================================
-- Deals across every lifecycle and offer type
-- ============================================================

-- Deals are inserted as drafts so their participating locations can be
-- attached before the publication validation trigger runs.
insert into public.business_deals (
  id,
  business_id,
  title,
  description,
  category,
  image_url,
  offer_type,
  discount_percentage,
  discount_amount_cents,
  original_price_cents,
  deal_price_cents,
  offer_details,
  gst_included,
  start_date,
  end_date,
  conditions,
  claim_limit,
  exclusions,
  redemption_instructions,
  status,
  created_at,
  updated_at
)
values
  (
    'd0000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001',
    '20% off weekday brunch',
    'Enjoy a complete weekday brunch at our Ponsonby cafe with twenty percent off.',
    'Food & Drink',
    '/src/assets/images/local-business-neighbourhood.jpg',
    'percentage_discount',
    20,
    null,
    null,
    null,
    null,
    true,
    current_date - 3,
    current_date + 21,
    'Valid Monday to Friday from 8:00 AM to 2:00 PM.',
    100,
    'Public holidays and delivery orders are excluded.',
    'Show the claimed deal in LocalLink before ordering.',
    'draft',
    now() - interval '4 days',
    now() - interval '3 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    '51000000-0000-0000-0000-000000000001',
    '$45 seasonal bouquet',
    'Pick up a hand-tied seasonal bouquet prepared fresh by our Grey Lynn florists.',
    'Retail',
    '/src/assets/images/local-neighbourhood-street.jpg',
    'special_price',
    null,
    null,
    6500,
    4500,
    null,
    true,
    current_date - 20,
    current_date + 14,
    'One bouquet per customer while seasonal flowers are available.',
    40,
    'Vases, delivery, and custom flower requests are excluded.',
    'Present the LocalLink claim code when collecting your bouquet.',
    'draft',
    now() - interval '21 days',
    now() - interval '20 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    '21000000-0000-0000-0000-000000000001',
    '$50 off a plumbing callout',
    'Save fifty dollars on a scheduled residential plumbing callout in central Auckland.',
    'Trades',
    '/src/assets/images/local-business-neighbourhood.jpg',
    'fixed_discount',
    null,
    5000,
    null,
    null,
    null,
    true,
    current_date + 5,
    current_date + 30,
    'Advance booking is required and standard callout areas apply.',
    30,
    'Parts, after-hours work, and emergency callouts are excluded.',
    'Mention your LocalLink claim code when confirming the booking.',
    'draft',
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    '41000000-0000-0000-0000-000000000001',
    'Buy one coffee, get one free',
    'Bring a neighbour and receive a second barista-made coffee at no extra charge.',
    'Food & Drink',
    '/src/assets/images/local-business-neighbourhood.jpg',
    'buy_one_get_one',
    null,
    null,
    null,
    null,
    'Buy one regular hot coffee and receive a second regular hot coffee free.',
    true,
    current_date - 30,
    current_date - 2,
    'Both drinks must be ordered together during cafe opening hours.',
    75,
    'Alternative milks and syrup upgrades cost extra.',
    'Show the claimed deal to the cashier before payment.',
    'draft',
    now() - interval '35 days',
    now() - interval '30 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000005',
    '61000000-0000-0000-0000-000000000001',
    'Free garden consultation',
    'Book a complimentary thirty-minute garden consultation with our local landscaping team.',
    'Services',
    '/src/assets/images/local-neighbourhood-street.jpg',
    'other',
    null,
    null,
    null,
    null,
    'A free on-site consultation and written outline for eligible Auckland properties.',
    true,
    current_date - 2,
    current_date + 28,
    'Bookings are subject to team availability and service-area coverage.',
    25,
    'Design drawings, materials, and physical work are not included.',
    'Claim the deal and call the workshop to arrange a suitable time.',
    'draft',
    now() - interval '3 days',
    now() - interval '2 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000006',
    '41000000-0000-0000-0000-000000000001',
    '15% off local lunch',
    'Receive fifteen percent off a cafe lunch made with locally sourced ingredients.',
    'Food & Drink',
    '/src/assets/images/local-business-neighbourhood.jpg',
    'percentage_discount',
    15,
    null,
    null,
    null,
    null,
    true,
    current_date - 7,
    current_date + 7,
    'Valid for dine-in lunch orders between 11:00 AM and 2:00 PM.',
    60,
    'Cabinet food, takeaway orders, and public holidays are excluded.',
    'Show the active claim screen before ordering.',
    'draft',
    now() - interval '8 days',
    now() - interval '7 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000007',
    '51000000-0000-0000-0000-000000000001',
    'Draft workshop flower bundle',
    'A complete but unpublished draft for testing the business deal editor workflow.',
    'Retail',
    '/src/assets/images/local-neighbourhood-street.jpg',
    'fixed_discount',
    null,
    1500,
    null,
    null,
    null,
    true,
    current_date + 10,
    current_date + 40,
    'Advance registration will be required when this deal is published.',
    20,
    'Workshop tickets and delivery will be excluded.',
    'Show the claim at the Grey Lynn studio.',
    'draft',
    now() - interval '2 hours',
    now() - interval '2 hours'
  );

insert into public.business_deal_locations (deal_id, location_id)
values
  ('d0000000-0000-0000-0000-000000000001', '41100000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', '51100000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000003', '21100000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000004', '41100000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000005', '61100000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000005', '61100000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000006', '41100000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000007', '51100000-0000-0000-0000-000000000001');

-- The publication trigger maps these records to active, scheduled, or expired
-- from their Auckland dates and records the matching status events.
update public.business_deals
set status = 'published'
where id in (
  'd0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000005',
  'd0000000-0000-0000-0000-000000000006'
);

insert into public.business_deal_claims (
  id,
  deal_id,
  customer_id,
  claimed_at,
  expires_at
)
values
  (
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    now() - interval '2 days',
    now() - interval '2 days' + interval '15 minutes'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000001',
    now() - interval '12 hours',
    now() - interval '12 hours' + interval '15 minutes'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000001',
    now() - interval '4 days',
    now() - interval '4 days' + interval '15 minutes'
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000006',
    '70000000-0000-0000-0000-000000000001',
    now() - interval '3 days',
    now() - interval '3 days' + interval '15 minutes'
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'd0000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',
    now() - interval '1 day',
    now() - interval '1 day' + interval '15 minutes'
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    now() - interval '6 hours',
    now() - interval '6 hours' + interval '15 minutes'
  ),
  (
    'c0000000-0000-0000-0000-000000000007',
    'd0000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    now() - interval '10 days',
    now() - interval '10 days' + interval '15 minutes'
  ),
  (
    'c0000000-0000-0000-0000-000000000008',
    'd0000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    now() - interval '20 days',
    now() - interval '20 days' + interval '15 minutes'
  ),
  (
    'c0000000-0000-0000-0000-000000000009',
    'd0000000-0000-0000-0000-000000000004',
    '70000000-0000-0000-0000-000000000001',
    now() - interval '10 days',
    now() - interval '10 days' + interval '15 minutes'
  );

insert into public.business_deal_redemptions (
  id,
  claim_id,
  redeemed_by,
  redeemed_at,
  transaction_amount_cents,
  savings_amount_cents
)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    now() - interval '2 days' + interval '8 minutes',
    4800,
    1200
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000004',
    '40000000-0000-0000-0000-000000000001',
    now() - interval '3 days' + interval '10 minutes',
    null,
    null
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000005',
    '40000000-0000-0000-0000-000000000001',
    now() - interval '1 day' + interval '6 minutes',
    3200,
    800
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001',
    now() - interval '12 hours' + interval '7 minutes',
    4500,
    2000
  );

insert into public.saved_deals (customer_id, deal_id, created_at)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    now() - interval '2 days'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    now() - interval '1 day'
  ),
  (
    '70000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    now() - interval '10 hours'
  ),
  (
    '70000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000005',
    now() - interval '6 hours'
  );

-- Preserve claims and redemption history while representing an early-ended
-- deal in both business and customer history screens.
update public.business_deals
set status = 'ended_early', ended_at = now() - interval '1 day'
where id = 'd0000000-0000-0000-0000-000000000006';

insert into public.business_notifications (
  business_id,
  notification_type,
  title,
  message,
  destination,
  related_job_request_id,
  related_quote_id,
  created_at,
  read_at
)
values
  (
    '21000000-0000-0000-0000-000000000001',
    'quote_approved',
    'Quote approved',
    'Casey approved your quote for the bathroom renovation plumbing job.',
    '/business/jobs/40000000-0000-0000-0000-000000000021',
    '40000000-0000-0000-0000-000000000021',
    '50000000-0000-0000-0000-000000000004',
    now() - interval '1 day',
    now() - interval '20 hours'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'quote_declined',
    'Quote declined',
    'Mia selected another provider for the custom garage shelving job.',
    '/business/jobs',
    '40000000-0000-0000-0000-000000000022',
    '50000000-0000-0000-0000-000000000007',
    now() - interval '12 hours',
    null
  ),
  (
    '31000000-0000-0000-0000-000000000001',
    'quote_updated',
    'Job details updated',
    'The customer updated timing details for the EV charger installation.',
    '/business/jobs/40000000-0000-0000-0000-000000000014',
    '40000000-0000-0000-0000-000000000014',
    '50000000-0000-0000-0000-000000000002',
    now() - interval '90 minutes',
    null
  );

insert into public.customer_notifications (
  customer_id,
  notification_type,
  title,
  message,
  destination,
  related_job_request_id,
  related_quote_id,
  related_deal_id,
  created_at,
  read_at
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'job_scheduled',
    'Job scheduled',
    'Ponsonby Plumbing Test scheduled your bathroom renovation plumbing work.',
    '/jobs/40000000-0000-0000-0000-000000000021',
    '40000000-0000-0000-0000-000000000021',
    '50000000-0000-0000-0000-000000000004',
    null,
    now() - interval '2 days',
    now() - interval '1 day'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    'in_progress',
    'Work is in progress',
    'Auckland Electrical Test has started the accepted kitchen rewiring job.',
    '/jobs/40000000-0000-0000-0000-000000000024',
    '40000000-0000-0000-0000-000000000024',
    '50000000-0000-0000-0000-000000000005',
    null,
    now() - interval '1 day',
    null
  ),
  (
    '70000000-0000-0000-0000-000000000001',
    'quote_withdrawn',
    'Quote withdrawn',
    'Harbour Home and Garden withdrew its landscaping consultation quote.',
    '/jobs/40000000-0000-0000-0000-000000000026',
    '40000000-0000-0000-0000-000000000026',
    '50000000-0000-0000-0000-000000000008',
    null,
    now() - interval '4 hours',
    null
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    'deal_ended',
    'Local lunch deal ended',
    '15% off local lunch ended early. Your claim remains available in claim history.',
    '/deals?claim=d0000000-0000-0000-0000-000000000006',
    null,
    null,
    'd0000000-0000-0000-0000-000000000006',
    now() - interval '1 day',
    null
  ),
  (
    '70000000-0000-0000-0000-000000000001',
    'deal_ended',
    'Local lunch deal ended',
    '15% off local lunch ended early. Your completed redemption remains in claim history.',
    '/deals?claim=d0000000-0000-0000-0000-000000000006',
    null,
    null,
    'd0000000-0000-0000-0000-000000000006',
    now() - interval '1 day',
    now() - interval '12 hours'
  );

-- The notification triggers queue local email deliveries. Mark a few records
-- with representative outcomes so delivery monitoring has complete examples.
with ranked_deliveries as (
  select
    id,
    row_number() over (order by created_at, id) as position
  from public.business_email_deliveries
)
update public.business_email_deliveries as delivery
set
  status = case
    when ranked.position = 1 then 'sent'
    when ranked.position = 2 then 'failed'
    else delivery.status
  end,
  attempt_count = case when ranked.position <= 2 then 1 else delivery.attempt_count end,
  provider_message_id = case
    when ranked.position = 1 then 'seed-provider-message-001'
    else delivery.provider_message_id
  end,
  last_error = case
    when ranked.position = 2 then 'Seeded provider timeout for retry testing'
    else delivery.last_error
  end,
  last_attempt_at = case when ranked.position <= 2 then now() - interval '30 minutes' else delivery.last_attempt_at end,
  sent_at = case when ranked.position = 1 then now() - interval '30 minutes' else delivery.sent_at end,
  updated_at = case when ranked.position <= 2 then now() - interval '30 minutes' else delivery.updated_at end
from ranked_deliveries as ranked
where delivery.id = ranked.id;

-- ============================================================
-- Loyalty programme and customer visit lookup
-- ============================================================

insert into public.business_loyalty_programmes (
  id,
  business_id,
  name,
  programme_type,
  reward_threshold,
  reward_value,
  terms,
  start_date,
  status
)
values
  (
    '47000000-0000-0000-0000-000000000105',
    '41000000-0000-0000-0000-000000000001',
    'Morning coffee rewards',
    'visit_card',
    8,
    null,
    'One reward per customer per completed card.',
    (now() at time zone 'Pacific/Auckland')::date - 30,
    'published'
  ),
  (
    '57000000-0000-0000-0000-000000000105',
    '51000000-0000-0000-0000-000000000001',
    'Seasonal flower savings',
    'spend_and_save',
    50,
    5,
    'One five-dollar reward per completed fifty-dollar spend target.',
    (now() at time zone 'Pacific/Auckland')::date - 60,
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
    '48000000-0000-0000-0000-000000000109',
    '47000000-0000-0000-0000-000000000105',
    '10000000-0000-0000-0000-000000000001',
    'LL-DEMO-0109',
    6
  ),
  (
    '48000000-0000-0000-0000-000000000110',
    '47000000-0000-0000-0000-000000000105',
    '70000000-0000-0000-0000-000000000001',
    'LL-DEMO-0110',
    1
  ),
  (
    '59000000-0000-0000-0000-000000000109',
    '57000000-0000-0000-0000-000000000105',
    '10000000-0000-0000-0000-000000000001',
    'LL-DEMO-0201',
    60
  ),
  (
    '59000000-0000-0000-0000-000000000110',
    '57000000-0000-0000-0000-000000000105',
    '70000000-0000-0000-0000-000000000001',
    'LL-DEMO-0202',
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
    '48000000-0000-0000-0000-000000000109',
    'progress_added',
    2,
    now() - interval '20 days'
  ),
  (
    '48000000-0000-0000-0000-000000000109',
    'progress_added',
    2,
    now() - interval '10 days'
  ),
  (
    '48000000-0000-0000-0000-000000000109',
    'progress_added',
    2,
    now() - interval '2 days'
  ),
  (
    '48000000-0000-0000-0000-000000000110',
    'progress_added',
    8,
    now() - interval '15 days'
  ),
  (
    '48000000-0000-0000-0000-000000000110',
    'reward_earned',
    null,
    now() - interval '15 days' + interval '1 minute'
  ),
  (
    '48000000-0000-0000-0000-000000000110',
    'reward_redeemed',
    null,
    now() - interval '14 days'
  ),
  (
    '48000000-0000-0000-0000-000000000110',
    'progress_added',
    1,
    now() - interval '1 day'
  ),
  (
    '59000000-0000-0000-0000-000000000109',
    'progress_added',
    60,
    now() - interval '35 days'
  ),
  (
    '59000000-0000-0000-0000-000000000109',
    'reward_earned',
    null,
    now() - interval '35 days' + interval '1 minute'
  ),
  (
    '59000000-0000-0000-0000-000000000110',
    'progress_added',
    50,
    now() - interval '25 days'
  ),
  (
    '59000000-0000-0000-0000-000000000110',
    'reward_earned',
    null,
    now() - interval '25 days' + interval '1 minute'
  ),
  (
    '59000000-0000-0000-0000-000000000110',
    'reward_redeemed',
    null,
    now() - interval '24 days'
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
