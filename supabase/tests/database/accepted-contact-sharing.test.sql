begin;

select plan(7);

update public.profiles
set
  formatted_address = '12 Franklin Road, Ponsonby, Auckland 1011, New Zealand',
  address_line1 = '12 Franklin Road',
  suburb = 'Ponsonby',
  city = 'Auckland',
  postcode = '1011',
  country_code = 'nz'
where id = '10000000-0000-0000-0000-000000000001';

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
  '95000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Accepted contact sharing test',
  'Database fixture for the accepted contact sharing boundary.',
  'Plumbing',
  'Plumbing',
  'Auckland',
  'Ponsonby',
  5,
  'open'
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
  status
)
values (
  '95000000-0000-0000-0000-000000000002',
  '95000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  'fixed',
  25000,
  current_date + 1,
  '9:00-10:00 AM',
  'Complete the requested plumbing work.',
  'Access to the property is required.',
  'One working day',
  'Contact sharing regression test quote.',
  'awaiting_response'
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
    from public.get_accepted_job_contacts()
    where job_request_id = '95000000-0000-0000-0000-000000000001'
  ),
  0::bigint,
  'the customer cannot receive contact details before acceptance'
);

select is(
  public.respond_to_job_quote(
    '95000000-0000-0000-0000-000000000002',
    true
  ),
  'accepted',
  'the customer can accept the quote'
);

select results_eq(
  $$
    select consumer_email, provider_email, consumer_address
    from public.get_accepted_job_contacts()
    where job_request_id = '95000000-0000-0000-0000-000000000001'
  $$,
  $$values (
    'consumer@test.locallink.nz'::text,
    'plumber@test.locallink.nz'::text,
    '12 Franklin Road, Ponsonby, Auckland 1011, New Zealand'::text
  )$$,
  'the customer receives both-party contact data after acceptance'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select results_eq(
  $$
    select consumer_name, consumer_email, provider_name
    from public.get_accepted_job_contacts(
      '21000000-0000-0000-0000-000000000001'
    )
    where job_request_id = '95000000-0000-0000-0000-000000000001'
  $$,
  $$values (
    'Casey Consumer'::text,
    'consumer@test.locallink.nz'::text,
    'Maungarei Plumbing'::text
  )$$,
  'the accepted provider receives the customer contact data'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.get_accepted_job_contacts(
      '31000000-0000-0000-0000-000000000001'
    )
    where job_request_id = '95000000-0000-0000-0000-000000000001'
  ),
  0::bigint,
  'an unrelated provider receives no contact row for its own business'
);

select throws_ok(
  $$
    select *
    from public.get_accepted_job_contacts(
      '21000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  'Service Marketplace access required',
  'an unrelated provider cannot impersonate the accepted business'
);

reset role;
update public.job_requests
set status = 'completed'
where id = '95000000-0000-0000-0000-000000000001';

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.get_accepted_job_contacts()
    where job_request_id = '95000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'the exchange remains available in completed job history'
);

select * from finish();
rollback;
