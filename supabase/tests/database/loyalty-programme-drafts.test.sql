begin;

select plan(12);

select has_table(
  'public',
  'business_loyalty_programmes',
  'business loyalty programmes exist'
);

select has_column(
  'public',
  'business_loyalty_programmes',
  'status',
  'loyalty programmes record their lifecycle status'
);

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select lives_ok(
  $$
    insert into public.business_loyalty_programmes (
      id,
      business_id,
      name
    )
    values (
      '47000000-0000-0000-0000-000000000103',
      '41000000-0000-0000-0000-000000000001',
      'Morning coffee rewards'
    )
  $$,
  'a registered loyalty business can start an incomplete programme draft'
);

select is(
  (
    select status
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000103'
  ),
  'draft',
  'a newly created loyalty programme is saved as Draft'
);

select is(
  (
    select count(*)
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000103'
  ),
  1::bigint,
  'the creating business can view its draft'
);

reset role;
update public.business_capabilities
set loyalty_enabled = false
where business_id = '21000000-0000-0000-0000-000000000001';

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select lives_ok(
  $$
    update public.business_loyalty_programmes
    set
      programme_type = 'visit_card',
      reward_threshold = 8,
      reward_description = 'Next visit free'
    where id = '47000000-0000-0000-0000-000000000103'
  $$,
  'the business can reopen and continue its saved draft later'
);

select is(
  (
    select concat_ws(
      '|',
      name,
      programme_type,
      reward_threshold::text,
      reward_description
    )
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000103'
  ),
  'Morning coffee rewards|visit_card|8.00|Next visit free',
  'reopening a draft preserves the information already entered'
);

select throws_ok(
  $$
    update public.business_loyalty_programmes
    set status = 'published'
    where id = '47000000-0000-0000-0000-000000000103'
  $$,
  '23514',
  'Complete every required loyalty programme field before publishing',
  'an incomplete draft cannot be made visible to consumers'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '50000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000103'
  ),
  0::bigint,
  'another loyalty business cannot view the draft'
);

select throws_ok(
  $$
    insert into public.business_loyalty_programmes (business_id, name)
    values (
      '41000000-0000-0000-0000-000000000001',
      'Another business draft'
    )
  $$,
  '42501',
  null,
  'another business cannot attach a draft to the creating business'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.business_loyalty_programmes
    where id = '47000000-0000-0000-0000-000000000103'
  ),
  0::bigint,
  'a consumer cannot view or use the draft'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select throws_ok(
  $$
    insert into public.business_loyalty_programmes (business_id, name)
    values (
      '21000000-0000-0000-0000-000000000001',
      'Unavailable loyalty draft'
    )
  $$,
  '42501',
  null,
  'a business without the loyalty capability cannot create a draft'
);

select * from finish();
rollback;
