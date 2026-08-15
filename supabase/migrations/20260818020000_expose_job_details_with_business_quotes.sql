-- Preserve the original lead context alongside a provider's submitted quote so
-- the provider can compare the request and their response in one place.

drop function if exists public.get_business_quotes(uuid);
create function public.get_business_quotes(p_business_id uuid)
returns table (
  quote_id uuid,
  job_request_id uuid,
  title text,
  description text,
  category text,
  city text,
  suburb text,
  urgency text,
  image_urls text[],
  quote_deadline timestamptz,
  price_type text,
  amount_cents integer,
  availability_date date,
  arrival_window text,
  included_work text,
  conditions text,
  expected_duration text,
  message text,
  quote_status text,
  response_deadline timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.business_has_capability(p_business_id, 'service_marketplace') then
    raise exception 'Service Marketplace access required' using errcode = '42501';
  end if;

  return query
  select
    quote.id::uuid,
    job.id::uuid,
    job.title::text,
    job.description::text,
    job.category::text,
    job.city::text,
    job.suburb::text,
    job.urgency::text,
    job.image_urls::text[],
    least(
      job.quote_deadline,
      public.three_working_days_after(job.created_at)
    )::timestamptz,
    quote.price_type::text,
    quote.amount_cents::integer,
    quote.availability_date::date,
    quote.arrival_window::text,
    quote.included_work::text,
    quote.conditions::text,
    quote.expected_duration::text,
    quote.message::text,
    case
      when quote.status = 'awaiting_response'
        and job.status in ('closed', 'cancelled') then 'request_withdrawn'
      when quote.status = 'awaiting_response'
        and now() > public.five_working_days_after(quote.created_at) then 'expired'
      when quote.status = 'rejected' then 'declined'
      else quote.status
    end::text,
    public.five_working_days_after(quote.created_at)::timestamptz,
    quote.created_at::timestamptz
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.business_id = p_business_id
    and quote.status <> 'accepted'
  order by quote.created_at desc;
end;
$$;

revoke all on function public.get_business_quotes(uuid) from public;
grant execute on function public.get_business_quotes(uuid) to authenticated;
