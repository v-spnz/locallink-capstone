begin;

select plan(4);

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
  '93000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Quote acceptance timeline test',
  'A database test job used to verify the first progress stage.',
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
  '93000000-0000-0000-0000-000000000002',
  '93000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  'fixed',
  25000,
  current_date + 1,
  '9:00-10:00 AM',
  'Complete the requested plumbing work.',
  'Access to the property is required.',
  'One working day',
  'Regression test quote.',
  'awaiting_response'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  public.respond_to_job_quote(
    '93000000-0000-0000-0000-000000000002',
    true
  ),
  'accepted',
  'the consumer can accept an awaiting quote'
);

select is(
  (
    select status
    from public.job_quotes
    where id = '93000000-0000-0000-0000-000000000002'
  ),
  'accepted',
  'accepting updates the quote status'
);

select is(
  (
    select status
    from public.job_requests
    where id = '93000000-0000-0000-0000-000000000001'
  ),
  'accepted',
  'a newly accepted quote starts the job at Accepted'
);

select results_eq(
  $$
    select status
    from public.job_status_history
    where job_request_id = '93000000-0000-0000-0000-000000000001'
    order by updated_at
  $$,
  $$values ('accepted'::text)$$,
  'acceptance records only the first timeline stage'
);

select * from finish();
rollback;
