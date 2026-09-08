begin;

select plan(9);

select has_extension('postgis', 'PostGIS is enabled');
select has_function('public', 'set_customer_location', 'customer location RPC exists');
select has_function('public', 'get_my_location', 'customer location reader exists');
select has_function('public', 'nearby_businesses', 'nearby business RPC exists');
select has_function(
  'public',
  'businesses_in_my_suburb',
  'saved-suburb discovery RPC exists'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.set_customer_location(
      'Queen Street, Auckland Central, Auckland 1010, New Zealand',
      'Queen Street',
      'Auckland Central',
      'Auckland',
      '1010',
      'nz',
      -36.8485,
      174.7633
    )
  $$,
  'a customer can save a geocoded address'
);

select is(
  (select city from public.get_my_location()),
  'Auckland',
  'the saved customer address can be read with coordinates'
);

select results_eq(
  $$
    select business_id
    from public.nearby_businesses(-36.8485, 174.7633, 5, null)
    limit 1
  $$,
  $$values ('21000000-0000-0000-0000-000000000001'::uuid)$$,
  'nearby businesses are returned closest first by PostGIS'
);

select results_eq(
  $$
    select business_id
    from public.businesses_in_my_suburb(null)
    limit 1
  $$,
  $$values ('21000000-0000-0000-0000-000000000001'::uuid)$$,
  'consumer discovery uses the authenticated customer saved suburb'
);

select * from finish();
rollback;
