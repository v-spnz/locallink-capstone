-- US0094: keep deal availability aligned with Auckland calendar dates and
-- enforce the same active window for discovery and claims.

alter table public.business_deals
  drop constraint if exists business_deals_status_check;

create or replace function public.is_business_deal_active(
  p_status text,
  p_start_date date,
  p_end_date date,
  p_now timestamptz default now()
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    p_status in ('scheduled', 'active')
    and (p_now at time zone 'Pacific/Auckland')::date
      between p_start_date and p_end_date;
$$;

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
    return new;
  end if;

  if new.status not in ('published', 'scheduled', 'active', 'expired') then
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
  end if;

  return new;
end;
$$;

update public.business_deals
set status = case
  when start_date > (now() at time zone 'Pacific/Auckland')::date then 'scheduled'
  when end_date < (now() at time zone 'Pacific/Auckland')::date then 'expired'
  else 'active'
end
where status = 'published';

alter table public.business_deals
  add constraint business_deals_status_check check (
    status in ('draft', 'scheduled', 'active', 'expired')
  );

create table public.business_deal_status_events (
  deal_id uuid not null references public.business_deals(id) on delete cascade,
  status text not null check (status in ('scheduled', 'active', 'expired')),
  changed_at timestamptz not null default now(),
  primary key (deal_id, status)
);

create or replace function public.record_business_deal_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status not in ('scheduled', 'active', 'expired') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.business_deal_status_events (deal_id, status)
    values (new.id, new.status)
    on conflict (deal_id, status) do nothing;
  elsif old.status is distinct from new.status then
    insert into public.business_deal_status_events (deal_id, status)
    values (new.id, new.status)
    on conflict (deal_id, status) do nothing;
  end if;

  return new;
end;
$$;

create trigger business_deal_record_status_event
  after insert or update of status on public.business_deals
  for each row execute function public.record_business_deal_status_event();

insert into public.business_deal_status_events (deal_id, status, changed_at)
select id, status, coalesce(published_at, updated_at)
from public.business_deals
where status in ('scheduled', 'active', 'expired')
on conflict (deal_id, status) do nothing;

create or replace function public.refresh_business_deal_statuses(
  p_today date default (now() at time zone 'Pacific/Auckland')::date
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_activated integer := 0;
  v_expired integer := 0;
begin
  if p_today is null then
    raise exception 'Current date is required';
  end if;

  update public.business_deals
  set status = 'active'
  where status = 'scheduled'
    and start_date <= p_today;
  get diagnostics v_activated = row_count;

  update public.business_deals
  set status = 'expired'
  where status = 'active'
    and end_date < p_today;
  get diagnostics v_expired = row_count;

  return v_activated + v_expired;
end;
$$;

revoke all on function public.refresh_business_deal_statuses(date) from public;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'refresh-business-deal-statuses',
  '*/5 * * * *',
  $schedule$select public.refresh_business_deal_statuses();$schedule$
);

create table public.business_deal_claims (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.business_deals(id) on delete restrict,
  customer_id uuid not null references auth.users(id) on delete restrict,
  claimed_at timestamptz not null default now(),
  unique (deal_id, customer_id)
);

create table public.business_deal_redemptions (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique
    references public.business_deal_claims(id) on delete restrict,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz not null default now()
);

create index business_deal_claims_deal_id_idx
  on public.business_deal_claims(deal_id, claimed_at);

create or replace function public.claim_business_deal(
  p_deal_id uuid
)
returns public.business_deal_claims
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_local_today date;
  v_deal public.business_deals;
  v_claim public.business_deal_claims;
  v_claim_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  v_local_today := (v_now at time zone 'Pacific/Auckland')::date;
  perform public.refresh_business_deal_statuses(v_local_today);

  select deal.*
  into v_deal
  from public.business_deals as deal
  where deal.id = p_deal_id
  for update;

  if not found
    or not public.is_business_deal_active(
      v_deal.status,
      v_deal.start_date,
      v_deal.end_date,
      v_now
    )
  then
    raise exception 'Deal is not active' using errcode = '55000';
  end if;

  select claim.*
  into v_claim
  from public.business_deal_claims as claim
  where claim.deal_id = p_deal_id
    and claim.customer_id = v_user_id;

  if found then
    return v_claim;
  end if;

  select count(*)::integer
  into v_claim_count
  from public.business_deal_claims
  where deal_id = p_deal_id;

  if v_claim_count >= v_deal.claim_limit then
    raise exception 'This deal has reached its claim limit' using errcode = '55000';
  end if;

  insert into public.business_deal_claims (deal_id, customer_id, claimed_at)
  values (p_deal_id, v_user_id, v_now)
  returning * into v_claim;

  return v_claim;
end;
$$;

create or replace function public.redeem_business_deal_claim(
  p_claim_id uuid
)
returns public.business_deal_redemptions
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_redemption public.business_deal_redemptions;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.business_deal_claims as claim
    join public.business_deals as deal on deal.id = claim.deal_id
    where claim.id = p_claim_id
      and public.is_business_member(deal.business_id)
  ) then
    raise exception 'Business membership required' using errcode = '42501';
  end if;

  insert into public.business_deal_redemptions (claim_id, redeemed_by)
  values (p_claim_id, v_user_id)
  on conflict (claim_id) do nothing
  returning * into v_redemption;

  if v_redemption.id is null then
    select redemption.*
    into v_redemption
    from public.business_deal_redemptions as redemption
    where redemption.claim_id = p_claim_id;
  end if;

  return v_redemption;
end;
$$;

revoke all on function public.claim_business_deal(uuid) from public;
revoke all on function public.redeem_business_deal_claim(uuid) from public;
grant execute on function public.claim_business_deal(uuid)
  to authenticated;
grant execute on function public.redeem_business_deal_claim(uuid)
  to authenticated;

alter table public.business_deal_status_events enable row level security;
alter table public.business_deal_claims enable row level security;
alter table public.business_deal_redemptions enable row level security;

grant select on public.business_deal_status_events to authenticated;
grant select on public.business_deal_claims to authenticated;
grant select on public.business_deal_redemptions to authenticated;

create policy "Business members can view deal status history"
  on public.business_deal_status_events for select to authenticated
  using (
    exists (
      select 1
      from public.business_deals as deal
      where deal.id = deal_id
        and public.is_business_member(deal.business_id)
    )
  );

create policy "Customers can view their own deal claims"
  on public.business_deal_claims for select to authenticated
  using (customer_id = (select auth.uid()));

create policy "Business members can view claims for their deals"
  on public.business_deal_claims for select to authenticated
  using (
    exists (
      select 1
      from public.business_deals as deal
      where deal.id = deal_id
        and public.is_business_member(deal.business_id)
    )
  );

create policy "Customers can view their own deal redemptions"
  on public.business_deal_redemptions for select to authenticated
  using (
    exists (
      select 1
      from public.business_deal_claims as claim
      where claim.id = claim_id
        and claim.customer_id = (select auth.uid())
    )
  );

create policy "Business members can view redemptions for their deals"
  on public.business_deal_redemptions for select to authenticated
  using (
    exists (
      select 1
      from public.business_deal_claims as claim
      join public.business_deals as deal on deal.id = claim.deal_id
      where claim.id = claim_id
        and public.is_business_member(deal.business_id)
    )
  );

drop policy if exists "Consumers can view published deals"
  on public.business_deals;
create policy "Consumers can view active deals"
  on public.business_deals for select to authenticated
  using (
    public.is_business_deal_active(status, start_date, end_date, now())
  );

drop policy if exists "Consumers can view locations for published deals"
  on public.business_locations;
create policy "Consumers can view locations for active deals"
  on public.business_locations for select to authenticated
  using (
    exists (
      select 1
      from public.business_deal_locations as deal_location
      join public.business_deals as deal on deal.id = deal_location.deal_id
      where deal_location.location_id = business_locations.id
        and public.is_business_deal_active(
          deal.status,
          deal.start_date,
          deal.end_date,
          now()
        )
    )
  );

drop policy if exists "Consumers can view published deal locations"
  on public.business_deal_locations;
create policy "Consumers can view active deal locations"
  on public.business_deal_locations for select to authenticated
  using (
    exists (
      select 1
      from public.business_deals as deal
      where deal.id = deal_id
        and public.is_business_deal_active(
          deal.status,
          deal.start_date,
          deal.end_date,
          now()
        )
    )
  );

create or replace function public.businesses_in_my_suburb(
  p_category text default null
)
returns table (
  business_id uuid,
  location_id uuid,
  business_name text,
  description text,
  category text,
  formatted_address text,
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  deal_id uuid,
  deal_title text,
  deal_description text,
  deal_image_url text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return query
  with search_origin as (
    select profile.location as point, trim(profile.suburb) as suburb
    from public.profiles as profile
    where profile.id = v_user_id
      and profile.location is not null
      and nullif(trim(profile.suburb), '') is not null
  ),
  candidates as (
    select
      business.id as business_id,
      location.id as location_id,
      business.business_name,
      business.description,
      coalesce(deal.category, case
        when capability.service_marketplace_enabled then 'Trades'
        else 'Services'
      end) as category,
      location.formatted_address,
      extensions.st_y(location.location::extensions.geometry) as latitude,
      extensions.st_x(location.location::extensions.geometry) as longitude,
      extensions.st_distance(location.location, origin.point) / 1000.0 as distance_km,
      deal.id as deal_id,
      deal.title as deal_title,
      deal.description as deal_description,
      deal.image_url as deal_image_url,
      row_number() over (
        partition by business.id
        order by location.location operator(extensions.<->) origin.point
      ) as proximity_rank
    from public.business_locations as location
    join public.businesses as business on business.id = location.business_id
    join public.business_capabilities as capability
      on capability.business_id = business.id
    cross join search_origin as origin
    left join lateral (
      select
        available_deal.id,
        available_deal.title,
        available_deal.description,
        available_deal.category,
        available_deal.image_url
      from public.business_deal_locations as deal_location
      join public.business_deals as available_deal
        on available_deal.id = deal_location.deal_id
      where deal_location.location_id = location.id
        and public.is_business_deal_active(
          available_deal.status,
          available_deal.start_date,
          available_deal.end_date,
          now()
        )
      order by available_deal.published_at desc
      limit 1
    ) as deal on true
    where location.location is not null
      and lower(trim(location.suburb)) = lower(origin.suburb)
  )
  select
    candidate.business_id,
    candidate.location_id,
    candidate.business_name,
    candidate.description,
    candidate.category,
    candidate.formatted_address,
    candidate.latitude,
    candidate.longitude,
    candidate.distance_km,
    candidate.deal_id,
    candidate.deal_title,
    candidate.deal_description,
    candidate.deal_image_url
  from candidates as candidate
  where candidate.proximity_rank = 1
    and (
      p_category is null
      or p_category = 'All'
      or candidate.category = p_category
    )
  order by candidate.distance_km, candidate.business_name;
end;
$$;

revoke all on function public.businesses_in_my_suburb(text) from public;
grant execute on function public.businesses_in_my_suburb(text)
  to authenticated;
grant execute on function public.is_business_deal_active(
  text,
  date,
  date,
  timestamptz
) to authenticated;

notify pgrst, 'reload schema';
