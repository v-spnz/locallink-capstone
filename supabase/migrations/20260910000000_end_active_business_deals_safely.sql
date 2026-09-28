
alter table public.business_deals
  add column ended_at timestamptz;

alter table public.business_deals
  drop constraint if exists business_deals_status_check;
alter table public.business_deals
  add constraint business_deals_status_check check (
    status in ('draft', 'scheduled', 'active', 'expired', 'ended_early')
  );

alter table public.business_deal_status_events
  drop constraint if exists business_deal_status_events_status_check;
alter table public.business_deal_status_events
  add constraint business_deal_status_events_status_check check (
    status in ('scheduled', 'active', 'expired', 'ended_early')
  );

create or replace function public.validate_published_business_deal()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_local_today date := (now() at time zone 'Pacific/Auckland')::date;
begin
  if new.status = 'draft' then
    new.published_at := null;
    new.ended_at := null;
    return new;
  end if;

  if new.status not in (
    'published', 'scheduled', 'active', 'expired', 'ended_early'
  ) then
    raise exception 'Invalid deal status' using errcode = '23514';
  end if;

  if char_length(trim(coalesce(new.title, ''))) < 3
    or char_length(trim(coalesce(new.description, ''))) < 10
    or char_length(trim(coalesce(new.category, ''))) < 2
    or char_length(trim(coalesce(new.image_url, ''))) = 0
    or new.offer_type is null
    or new.gst_included is null
    or new.start_date is null
    or new.end_date is null
    or new.claim_limit is null
    or char_length(trim(coalesce(new.redemption_instructions, ''))) < 3
  then
    raise exception 'Complete every required deal field before publishing'
      using errcode = '23514';
  end if;

  if (new.offer_type = 'percentage_discount' and new.discount_percentage is null)
    or (new.offer_type = 'fixed_discount' and new.discount_amount_cents is null)
    or (
      new.offer_type = 'special_price'
      and (new.original_price_cents is null or new.deal_price_cents is null)
    )
    or (
      new.offer_type in ('buy_one_get_one', 'other')
      and char_length(trim(coalesce(new.offer_details, ''))) < 2
    )
  then
    raise exception 'Complete the pricing information for the selected offer type'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.business_deal_locations
    where deal_id = new.id
  ) then
    raise exception 'Select at least one participating location before publishing'
      using errcode = '23514';
  end if;

  new.published_at := coalesce(new.published_at, now());

  if new.status = 'published' then
    new.status := case
      when new.start_date > v_local_today then 'scheduled'
      when new.end_date < v_local_today then 'expired'
      else 'active'
    end;
    new.ended_at := null;
  end if;

  return new;
end;
$$;

create or replace function public.record_business_deal_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status not in ('scheduled', 'active', 'expired', 'ended_early') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.business_deal_status_events (deal_id, status, changed_at)
    values (
      new.id,
      new.status,
      case when new.status = 'ended_early' then new.ended_at else now() end
    )
    on conflict (deal_id, status) do nothing;
  elsif old.status is distinct from new.status then
    insert into public.business_deal_status_events (deal_id, status, changed_at)
    values (
      new.id,
      new.status,
      case when new.status = 'ended_early' then new.ended_at else now() end
    )
    on conflict (deal_id, status) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.prevent_ended_business_deal_reactivation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'ended_early' and new.status <> 'ended_early' then
    raise exception 'An ended deal cannot be reactivated'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create trigger business_deal_prevent_ended_reactivation
  before update of status on public.business_deals
  for each row execute function public.prevent_ended_business_deal_reactivation();

alter table public.customer_notifications
  drop constraint if exists customer_notifications_notification_type_check;
alter table public.customer_notifications
  add constraint customer_notifications_notification_type_check check (
    notification_type in (
      'new_quote',
      'quote_withdrawn',
      'job_completed',
      'job_scheduled',
      'on_the_way',
      'in_progress',
      'quote_deadline_reminder',
      'deal_ended'
    )
  );

alter table public.customer_notifications
  add column related_deal_id uuid
    references public.business_deals(id) on delete set null;

create unique index customer_notifications_one_ended_deal_notice_idx
  on public.customer_notifications (customer_id, related_deal_id)
  where notification_type = 'deal_ended';

create or replace function public.get_business_deal_end_summary(
  p_deal_id uuid
)
returns table (
  deal_id uuid,
  deal_title text,
  deal_status text,
  claim_count integer,
  unredeemed_claim_count integer
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_deal public.business_deals;
begin
  perform public.refresh_business_deal_statuses();

  select deal.*
  into v_deal
  from public.business_deals as deal
  where deal.id = p_deal_id;

  if not found or not public.is_business_member(v_deal.business_id) then
    raise exception 'Business membership required' using errcode = '42501';
  end if;

  if not public.is_business_deal_active(
    v_deal.status,
    v_deal.start_date,
    v_deal.end_date,
    now()
  ) then
    raise exception 'Only an Active deal can be ended early'
      using errcode = '55000';
  end if;

  return query
  select
    v_deal.id,
    v_deal.title,
    v_deal.status,
    count(claim.id)::integer,
    count(claim.id) filter (where redemption.id is null)::integer
  from public.business_deal_claims as claim
  left join public.business_deal_redemptions as redemption
    on redemption.claim_id = claim.id
  where claim.deal_id = v_deal.id;
end;
$$;

create or replace function public.end_business_deal(
  p_deal_id uuid
)
returns table (
  ended_deal_id uuid,
  ended_status text,
  ended_at timestamptz,
  claim_count integer,
  notifications_created integer
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_deal public.business_deals;
  v_ended_at timestamptz := now();
  v_claim_count integer := 0;
  v_notifications_created integer := 0;
begin
  perform public.refresh_business_deal_statuses();

  select deal.*
  into v_deal
  from public.business_deals as deal
  where deal.id = p_deal_id
  for update;

  if not found or not public.is_business_member(v_deal.business_id) then
    raise exception 'Business membership required' using errcode = '42501';
  end if;

  if not public.is_business_deal_active(
    v_deal.status,
    v_deal.start_date,
    v_deal.end_date,
    v_ended_at
  ) then
    raise exception 'Only an Active deal can be ended early'
      using errcode = '55000';
  end if;

  select count(*)::integer
  into v_claim_count
  from public.business_deal_claims as claim
  where claim.deal_id = v_deal.id;

  update public.business_deals
  set status = 'ended_early', ended_at = v_ended_at
  where id = v_deal.id;

  insert into public.customer_notifications (
    customer_id,
    notification_type,
    title,
    message,
    destination,
    related_deal_id
  )
  select
    claim.customer_id,
    'deal_ended',
    'Deal ended early',
    case
      when redemption.id is null then
        coalesce(v_deal.title, 'A deal you claimed') ||
          ' ended early. Your existing claim remains redeemable under the original terms.'
      else
        coalesce(v_deal.title, 'A deal you claimed') ||
          ' ended early. Your completed redemption record remains available.'
    end,
    '/deals?claim=' || v_deal.id,
    v_deal.id
  from public.business_deal_claims as claim
  left join public.business_deal_redemptions as redemption
    on redemption.claim_id = claim.id
  where claim.deal_id = v_deal.id
  on conflict (customer_id, related_deal_id)
    where notification_type = 'deal_ended'
    do nothing;
  get diagnostics v_notifications_created = row_count;

  return query
  select
    v_deal.id,
    'ended_early'::text,
    v_ended_at,
    v_claim_count,
    v_notifications_created;
end;
$$;

create or replace function public.get_my_business_deal_claims()
returns table (
  claim_id uuid,
  deal_id uuid,
  claimed_at timestamptz,
  redeemed_at timestamptz,
  ended_at timestamptz,
  status text,
  title text,
  description text,
  category text,
  image_url text,
  offer_type text,
  discount_percentage numeric,
  discount_amount_cents integer,
  original_price_cents integer,
  deal_price_cents integer,
  offer_details text,
  start_date date,
  end_date date,
  conditions text,
  claim_limit integer,
  exclusions text,
  redemption_instructions text,
  business_name text,
  formatted_address text,
  suburb text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
begin
  if v_customer_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return query
  select
    claim.id,
    deal.id,
    claim.claimed_at,
    redemption.redeemed_at,
    deal.ended_at,
    deal.status,
    deal.title,
    deal.description,
    deal.category,
    deal.image_url,
    deal.offer_type,
    deal.discount_percentage,
    deal.discount_amount_cents,
    deal.original_price_cents,
    deal.deal_price_cents,
    deal.offer_details,
    deal.start_date,
    deal.end_date,
    deal.conditions,
    deal.claim_limit,
    deal.exclusions,
    deal.redemption_instructions,
    business.business_name,
    location.formatted_address,
    location.suburb
  from public.business_deal_claims as claim
  join public.business_deals as deal on deal.id = claim.deal_id
  join public.businesses as business on business.id = deal.business_id
  left join public.business_deal_redemptions as redemption
    on redemption.claim_id = claim.id
  left join lateral (
    select business_location.formatted_address, business_location.suburb
    from public.business_deal_locations as deal_location
    join public.business_locations as business_location
      on business_location.id = deal_location.location_id
    where deal_location.deal_id = deal.id
    order by business_location.is_primary desc, business_location.created_at
    limit 1
  ) as location on true
  where claim.customer_id = v_customer_id
  order by claim.claimed_at desc;
end;
$$;

revoke all on function public.get_business_deal_end_summary(uuid) from public;
revoke all on function public.end_business_deal(uuid) from public;
revoke all on function public.get_my_business_deal_claims() from public;

grant execute on function public.get_business_deal_end_summary(uuid)
  to authenticated;
grant execute on function public.end_business_deal(uuid)
  to authenticated;
grant execute on function public.get_my_business_deal_claims()
  to authenticated;
