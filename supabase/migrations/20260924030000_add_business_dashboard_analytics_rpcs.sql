
create function public.get_business_dashboard_metrics(
  p_business_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  total_deals bigint,
  draft_deals bigint,
  active_deals bigint,
  scheduled_deals bigint,
  expired_deals bigint,
  ended_early_deals bigint,
  deal_claims bigint,
  deal_redemptions bigint,
  deal_claim_cohort_redemptions bigint,
  deal_claim_to_redemption_rate numeric,
  unique_deal_customers bigint,
  recorded_transaction_value_cents bigint,
  recorded_customer_savings_cents bigint,
  average_recorded_transaction_cents numeric,
  redemptions_with_transaction_value bigint,
  loyalty_customers bigint,
  active_loyalty_customers bigint,
  loyalty_activity_events bigint,
  loyalty_rewards_earned bigint,
  loyalty_rewards_redeemed bigint,
  marketplace_matched_leads bigint,
  marketplace_quotes_submitted bigint,
  marketplace_quotes_accepted bigint,
  marketplace_jobs_won bigint,
  marketplace_completed_jobs bigint,
  marketplace_lead_to_quote_rate numeric,
  marketplace_quote_to_job_rate numeric,
  marketplace_lead_to_job_rate numeric
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

  if p_start_date is null or p_end_date is null then
    raise exception 'Start and end dates are required' using errcode = '22023';
  end if;

  if p_start_date > p_end_date then
    raise exception 'Start date must not be after end date'
      using errcode = '22023';
  end if;

  v_start_at := p_start_date::timestamp at time zone 'Pacific/Auckland';
  v_end_at := (p_end_date + 1)::timestamp at time zone 'Pacific/Auckland';

  return query
  with deal_snapshot as (
    select
      count(*) as total_deals,
      count(*) filter (where deal.status = 'draft') as draft_deals,
      count(*) filter (where deal.status = 'active') as active_deals,
      count(*) filter (where deal.status = 'scheduled') as scheduled_deals,
      count(*) filter (where deal.status = 'expired') as expired_deals,
      count(*) filter (where deal.status = 'ended_early') as ended_early_deals
    from public.business_deals as deal
    where deal.business_id = p_business_id
  ),
  claim_period as (
    select claim.id, claim.customer_id
    from public.business_deal_claims as claim
    join public.business_deals as deal on deal.id = claim.deal_id
    where deal.business_id = p_business_id
      and claim.claimed_at >= v_start_at
      and claim.claimed_at < v_end_at
  ),
  claim_metrics as (
    select
      count(*) as claims,
      count(distinct claim_period.customer_id) as unique_customers,
      count(*) filter (
        where exists (
          select 1
          from public.business_deal_redemptions as redemption
          where redemption.claim_id = claim_period.id
        )
      ) as cohort_redemptions
    from claim_period
  ),
  redemption_metrics as (
    select
      count(*) as redemptions,
      sum(redemption.transaction_amount_cents) as transaction_value,
      sum(redemption.savings_amount_cents) as customer_savings,
      round(avg(redemption.transaction_amount_cents)::numeric, 2)
        as average_transaction,
      count(redemption.transaction_amount_cents) as valued_redemptions
    from public.business_deal_redemptions as redemption
    join public.business_deal_claims as claim on claim.id = redemption.claim_id
    join public.business_deals as deal on deal.id = claim.deal_id
    where deal.business_id = p_business_id
      and redemption.redeemed_at >= v_start_at
      and redemption.redeemed_at < v_end_at
  ),
  loyalty_customer_metrics as (
    select count(distinct record.customer_id) as total_customers
    from public.customer_loyalty_records as record
    join public.business_loyalty_programmes as programme
      on programme.id = record.programme_id
    where programme.business_id = p_business_id
  ),
  loyalty_activity_metrics as (
    select
      count(*) as activity_events,
      count(distinct record.customer_id) as active_customers,
      count(*) filter (
        where activity.activity_type = 'reward_earned'
      ) as rewards_earned,
      count(*) filter (
        where activity.activity_type = 'reward_redeemed'
      ) as rewards_redeemed
    from public.loyalty_activity as activity
    join public.customer_loyalty_records as record
      on record.id = activity.loyalty_record_id
    join public.business_loyalty_programmes as programme
      on programme.id = record.programme_id
    where programme.business_id = p_business_id
      and activity.created_at >= v_start_at
      and activity.created_at < v_end_at
  ),
  match_period as (
    select match.job_request_id
    from public.business_job_lead_matches as match
    where match.business_id = p_business_id
      and match.matched_at >= v_start_at
      and match.matched_at < v_end_at
  ),
  match_metrics as (
    select
      count(*) as matched_leads,
      count(*) filter (
        where exists (
          select 1
          from public.job_quotes as quote
          where quote.job_request_id = match_period.job_request_id
            and quote.business_id = p_business_id
        )
      ) as leads_with_quotes,
      count(*) filter (
        where exists (
          select 1
          from public.job_quotes as quote
          where quote.job_request_id = match_period.job_request_id
            and quote.business_id = p_business_id
            and quote.status = 'accepted'
        )
      ) as leads_with_jobs
    from match_period
  ),
  quote_metrics as (
    select
      count(*) as submitted_quotes,
      count(*) filter (where quote.status = 'accepted') as accepted_quotes
    from public.job_quotes as quote
    where quote.business_id = p_business_id
      and quote.created_at >= v_start_at
      and quote.created_at < v_end_at
  ),
  completed_job_metrics as (
    select count(distinct history.job_request_id) as completed_jobs
    from public.job_status_history as history
    where history.status = 'completed'
      and history.updated_at >= v_start_at
      and history.updated_at < v_end_at
      and exists (
        select 1
        from public.job_quotes as quote
        where quote.job_request_id = history.job_request_id
          and quote.business_id = p_business_id
          and quote.status = 'accepted'
      )
  )
  select
    deal_snapshot.total_deals,
    deal_snapshot.draft_deals,
    deal_snapshot.active_deals,
    deal_snapshot.scheduled_deals,
    deal_snapshot.expired_deals,
    deal_snapshot.ended_early_deals,
    claim_metrics.claims,
    redemption_metrics.redemptions,
    claim_metrics.cohort_redemptions,
    case
      when claim_metrics.claims = 0 then 0::numeric
      else round(
        claim_metrics.cohort_redemptions * 100.0 / claim_metrics.claims,
        2
      )
    end,
    claim_metrics.unique_customers,
    redemption_metrics.transaction_value,
    redemption_metrics.customer_savings,
    redemption_metrics.average_transaction,
    redemption_metrics.valued_redemptions,
    loyalty_customer_metrics.total_customers,
    loyalty_activity_metrics.active_customers,
    loyalty_activity_metrics.activity_events,
    loyalty_activity_metrics.rewards_earned,
    loyalty_activity_metrics.rewards_redeemed,
    match_metrics.matched_leads,
    quote_metrics.submitted_quotes,
    quote_metrics.accepted_quotes,
    quote_metrics.accepted_quotes,
    completed_job_metrics.completed_jobs,
    case
      when match_metrics.matched_leads = 0 then 0::numeric
      else round(
        match_metrics.leads_with_quotes * 100.0 / match_metrics.matched_leads,
        2
      )
    end,
    case
      when quote_metrics.submitted_quotes = 0 then 0::numeric
      else round(
        quote_metrics.accepted_quotes * 100.0 /
          quote_metrics.submitted_quotes,
        2
      )
    end,
    case
      when match_metrics.matched_leads = 0 then 0::numeric
      else round(
        match_metrics.leads_with_jobs * 100.0 / match_metrics.matched_leads,
        2
      )
    end
  from deal_snapshot
  cross join claim_metrics
  cross join redemption_metrics
  cross join loyalty_customer_metrics
  cross join loyalty_activity_metrics
  cross join match_metrics
  cross join quote_metrics
  cross join completed_job_metrics;
end;
$$;

create function public.get_business_deal_performance(
  p_business_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  deal_id uuid,
  deal_name text,
  category text,
  deal_status text,
  claims bigint,
  redemptions bigint,
  claim_cohort_redemptions bigint,
  claim_to_redemption_rate numeric,
  unique_customers bigint,
  recorded_transaction_value_cents bigint,
  recorded_customer_savings_cents bigint,
  average_recorded_transaction_cents numeric,
  redemptions_with_transaction_value bigint
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

  if p_start_date is null or p_end_date is null then
    raise exception 'Start and end dates are required' using errcode = '22023';
  end if;

  if p_start_date > p_end_date then
    raise exception 'Start date must not be after end date'
      using errcode = '22023';
  end if;

  v_start_at := p_start_date::timestamp at time zone 'Pacific/Auckland';
  v_end_at := (p_end_date + 1)::timestamp at time zone 'Pacific/Auckland';

  return query
  select
    deal.id,
    deal.title,
    deal.category,
    deal.status,
    claim_metrics.claims,
    redemption_metrics.redemptions,
    claim_metrics.cohort_redemptions,
    case
      when claim_metrics.claims = 0 then 0::numeric
      else round(
        claim_metrics.cohort_redemptions * 100.0 / claim_metrics.claims,
        2
      )
    end,
    claim_metrics.unique_customers,
    redemption_metrics.transaction_value,
    redemption_metrics.customer_savings,
    redemption_metrics.average_transaction,
    redemption_metrics.valued_redemptions
  from public.business_deals as deal
  cross join lateral (
    select
      count(*) as claims,
      count(distinct claim.customer_id) as unique_customers,
      count(*) filter (
        where exists (
          select 1
          from public.business_deal_redemptions as redemption
          where redemption.claim_id = claim.id
        )
      ) as cohort_redemptions
    from public.business_deal_claims as claim
    where claim.deal_id = deal.id
      and claim.claimed_at >= v_start_at
      and claim.claimed_at < v_end_at
  ) as claim_metrics
  cross join lateral (
    select
      count(*) as redemptions,
      sum(redemption.transaction_amount_cents) as transaction_value,
      sum(redemption.savings_amount_cents) as customer_savings,
      round(avg(redemption.transaction_amount_cents)::numeric, 2)
        as average_transaction,
      count(redemption.transaction_amount_cents) as valued_redemptions
    from public.business_deal_claims as claim
    join public.business_deal_redemptions as redemption
      on redemption.claim_id = claim.id
    where claim.deal_id = deal.id
      and redemption.redeemed_at >= v_start_at
      and redemption.redeemed_at < v_end_at
  ) as redemption_metrics
  where deal.business_id = p_business_id
  order by deal.created_at desc, deal.id;
end;
$$;

create function public.get_business_loyalty_programme_performance(
  p_business_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  programme_id uuid,
  programme_name text,
  programme_type text,
  programme_status text,
  total_customers bigint,
  active_customers bigint,
  progress_events bigint,
  progress_amount numeric,
  rewards_earned bigint,
  rewards_redeemed bigint
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

  if p_start_date is null or p_end_date is null then
    raise exception 'Start and end dates are required' using errcode = '22023';
  end if;

  if p_start_date > p_end_date then
    raise exception 'Start date must not be after end date'
      using errcode = '22023';
  end if;

  v_start_at := p_start_date::timestamp at time zone 'Pacific/Auckland';
  v_end_at := (p_end_date + 1)::timestamp at time zone 'Pacific/Auckland';

  return query
  select
    programme.id,
    programme.name,
    programme.programme_type,
    programme.status,
    customer_metrics.total_customers,
    activity_metrics.active_customers,
    activity_metrics.progress_events,
    activity_metrics.progress_amount,
    activity_metrics.rewards_earned,
    activity_metrics.rewards_redeemed
  from public.business_loyalty_programmes as programme
  cross join lateral (
    select count(distinct record.customer_id) as total_customers
    from public.customer_loyalty_records as record
    where record.programme_id = programme.id
  ) as customer_metrics
  cross join lateral (
    select
      count(distinct record.customer_id) as active_customers,
      count(*) filter (
        where activity.activity_type = 'progress_added'
      ) as progress_events,
      coalesce(
        sum(activity.amount) filter (
          where activity.activity_type = 'progress_added'
        ),
        0::numeric
      ) as progress_amount,
      count(*) filter (
        where activity.activity_type = 'reward_earned'
      ) as rewards_earned,
      count(*) filter (
        where activity.activity_type = 'reward_redeemed'
      ) as rewards_redeemed
    from public.customer_loyalty_records as record
    join public.loyalty_activity as activity
      on activity.loyalty_record_id = record.id
      and activity.created_at >= v_start_at
      and activity.created_at < v_end_at
    where record.programme_id = programme.id
  ) as activity_metrics
  where programme.business_id = p_business_id
  order by programme.created_at desc, programme.id;
end;
$$;

revoke all on function public.get_business_dashboard_metrics(
  uuid,
  date,
  date
) from public;
revoke all on function public.get_business_deal_performance(
  uuid,
  date,
  date
) from public;
revoke all on function public.get_business_loyalty_programme_performance(
  uuid,
  date,
  date
) from public;

grant execute on function public.get_business_dashboard_metrics(
  uuid,
  date,
  date
) to authenticated;
grant execute on function public.get_business_deal_performance(
  uuid,
  date,
  date
) to authenticated;
grant execute on function public.get_business_loyalty_programme_performance(
  uuid,
  date,
  date
) to authenticated;

comment on function public.get_business_dashboard_metrics(uuid, date, date) is
  'Aggregate dashboard metrics for one business. Historical lead matches before 24 September 2026 may be incomplete if their notifications were dismissed before migration.';

notify pgrst, 'reload schema';
