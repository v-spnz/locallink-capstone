begin;

select plan(10);

select has_table('public', 'business_locations', 'business locations exist');
select has_table('public', 'business_deals', 'business deals exist');
select has_table(
  'public',
  'business_deal_locations',
  'deal locations exist'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select lives_ok(
  $$
    insert into public.business_deals (id, business_id, title, status)
    values (
      '27000000-0000-0000-0000-000000000001',
      '21000000-0000-0000-0000-000000000001',
      null,
      'draft'
    )
  $$,
  'an incomplete deal can be saved as a draft'
);

select is(
  (
    select count(*)
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'the business can view its private draft'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select is(
  (
    select count(*)
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000001'
  ),
  0::bigint,
  'a consumer cannot view a draft'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);

select throws_ok(
  $$
    insert into public.business_deals (
      business_id,
      start_date,
      end_date,
      status
    )
    values (
      '21000000-0000-0000-0000-000000000001',
      '2026-09-02',
      '2026-09-01',
      'draft'
    )
  $$,
  '23514',
  null,
  'an end date earlier than its start date is rejected'
);

select throws_ok(
  $$
    update public.business_deals
    set status = 'published'
    where id = '27000000-0000-0000-0000-000000000001'
  $$,
  '23514',
  'Complete every required deal field before publishing',
  'an incomplete draft cannot be published'
);

select lives_ok(
  $$
    insert into public.business_deal_locations (deal_id, location_id)
    values (
      '27000000-0000-0000-0000-000000000001',
      '21100000-0000-0000-0000-000000000001'
    );

    update public.business_deals
    set
      title = '20% off plumbing callout',
      description = 'A complete database acceptance test deal.',
      category = 'Trades',
      image_url = 'https://example.test/deal.jpg',
      offer_type = 'percentage_discount',
      discount_percentage = 20,
      gst_included = true,
      start_date = '2026-09-01',
      end_date = '2026-09-30',
      claim_limit = 100,
      redemption_instructions = 'Show the LocalLink deal before booking.',
      status = 'published'
    where id = '27000000-0000-0000-0000-000000000001'
  $$,
  'a complete deal with a participating location can be published'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select is(
  (
    select count(*)
    from public.business_deals
    where id = '27000000-0000-0000-0000-000000000001'
      and status = 'published'
  ),
  1::bigint,
  'a consumer can view the published deal'
);

select * from finish();
rollback;
