create function public.get_business_dashboard_trends(
  p_business_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  date date,
  claims bigint,
  redemptions bigint,
  valued_redemptions bigint,
  recorded_value_cents bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_start_at timestamptz;
  v_end_at timestamptz;
begin
  if auth.uid() is null or not public.is_business_member(p_business_id) then
    raise exception 'Business membership required' using errcode = '42501';
  end if;

  if p_start_date is null or p_end_date is null or p_start_date > p_end_date then
    raise exception 'Valid start and end dates are required' using errcode = '22023';
  end if;

  v_start_at := p_start_date::timestamp at time zone 'Pacific/Auckland';
  v_end_at := (p_end_date + 1)::timestamp at time zone 'Pacific/Auckland';

  return query
  with events as (
    select (claim.claimed_at at time zone 'Pacific/Auckland')::date as event_day,
      1::bigint as claim_count, 0::bigint as redemption_count,
      null::bigint as amount_cents
    from public.business_deal_claims as claim
    join public.business_deals as deal on deal.id = claim.deal_id
    where deal.business_id = p_business_id
      and claim.claimed_at >= v_start_at and claim.claimed_at < v_end_at
    union all
    select (redemption.redeemed_at at time zone 'Pacific/Auckland')::date,
      0::bigint, 1::bigint, redemption.transaction_amount_cents::bigint
    from public.business_deal_redemptions as redemption
    join public.business_deal_claims as claim on claim.id = redemption.claim_id
    join public.business_deals as deal on deal.id = claim.deal_id
    where deal.business_id = p_business_id
      and redemption.redeemed_at >= v_start_at and redemption.redeemed_at < v_end_at
  ), bucketed as (
    select case
      when p_end_date - p_start_date < 31 then event_day
      when p_end_date - p_start_date < 180 then
        p_start_date + ((event_day - p_start_date) / 7) * 7
      else date_trunc('month', event_day::timestamp)::date
    end as bucket_date, claim_count, redemption_count, amount_cents
    from events
  )
  select bucket_date, sum(claim_count)::bigint, sum(redemption_count)::bigint,
    count(amount_cents), sum(amount_cents)::bigint
  from bucketed
  group by bucket_date
  order by bucket_date;
end;
$$;

revoke all on function public.get_business_dashboard_trends(uuid, date, date) from public;
grant execute on function public.get_business_dashboard_trends(uuid, date, date) to authenticated;
notify pgrst, 'reload schema';
