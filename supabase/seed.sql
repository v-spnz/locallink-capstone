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

-- Email identities allow the seeded users to sign in normally.

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

-- The existing on_auth_user_created trigger automatically creates profiles.

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
    false,
    false,
    true
  ),
  (
    '31000000-0000-0000-0000-000000000001',
    false,
    false,
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

-- ============================================================
-- Consumer job requests
-- ============================================================

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
  status,
  created_at,
  updated_at
)
values
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
    'closed',
    now() - interval '1 day',
    now() - interval '1 day'
  );

-- Existing quote: this job remains a lead but should have has_quote = true.

insert into public.job_quotes (
  id,
  job_request_id,
  business_id,
  amount_cents,
  message,
  status,
  created_at,
  updated_at
)
values (
  '50000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000003',
  '21000000-0000-0000-0000-000000000001',
  18500,
  'I can inspect and repair the blocked sink tomorrow morning.',
  'submitted',
  now() - interval '30 minutes',
  now() - interval '30 minutes'
);

commit;