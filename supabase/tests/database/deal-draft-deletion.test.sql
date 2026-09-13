begin;

select plan(9);

select has_function(
  'public',
  'delete_business_deal',
  array['uuid', 'uuid'],
  'the draft deletion function exists'
);

insert into public.business_deals (id, business_id, title, status)
values
  (
    '27000000-0000-0000-0000-000000000098',
    '21000000-0000-0000-0000-000000000001',
    'Draft ready to delete',
    'draft'
  ),
  (
    '27000000-0000-0000-0000-000000000099',
    '21000000-0000-0000-0000-000000000001',
    'Draft protected from another business',
    'draft'
  );

insert into public.business_deal_locations (deal_id, location_id)
values (
  '27000000-0000-0000-0000-000000000098',
  '21100000-0000-0000-0000-000000000001'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  public.delete_business_deal(
    '21000000-0000-0000-0000-000000000001',
    '27000000-0000-0000-0000-000000000098'
  ),
  true,
  'a business manager can delete an owned draft'
);

reset role;

select is(
  (
    select count(*)
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000098'
  ),
  0::bigint,
  'the deleted draft is removed'
);

select is(
  (
    select count(*)
    from public.business_deal_locations
    where deal_id = '27000000-0000-0000-0000-000000000098'
  ),
  0::bigint,
  'deleting a draft removes its location links'
);

select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select public.delete_business_deal(
      '21000000-0000-0000-0000-000000000001',
      '27000000-0000-0000-0000-000000000099'
    )
  $$,
  '42501',
  'Business manager access required',
  'another business cannot delete the draft'
);

reset role;

select is(
  (
    select count(*)
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000099'
  ),
  1::bigint,
  'an unauthorized deletion leaves the draft intact'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select public.delete_business_deal(
      '21000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000003'
    )
  $$,
  '55000',
  'Only draft deals can be deleted',
  'a published lifecycle deal cannot be deleted'
);

reset role;

select is(
  (
    select count(*)
    from public.business_deals
    where id = 'd0000000-0000-0000-0000-000000000003'
  ),
  1::bigint,
  'the protected published deal remains stored'
);

select ok(
  (
    select status <> 'draft'
    from public.business_deals
    where id = 'd0000000-0000-0000-0000-000000000003'
  ),
  'the protected deal retains its published lifecycle status'
);

select * from finish();
rollback;
