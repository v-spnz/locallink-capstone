-- US0090: persist complete and incomplete business deal drafts while keeping
-- every draft private to the business that created it.

create table public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  created_at timestamptz not null default now(),
  unique (business_id, name)
);

create table public.business_deals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text check (title is null or char_length(trim(title)) between 3 and 120),
  description text check (
    description is null or char_length(trim(description)) between 10 and 1000
  ),
  category text check (category is null or char_length(trim(category)) between 2 and 80),
  image_url text,
  offer_type text check (
    offer_type is null or offer_type in (
      'percentage_discount',
      'fixed_discount',
      'special_price',
      'buy_one_get_one',
      'other'
    )
  ),
  discount_percentage numeric(5, 2) check (
    discount_percentage is null
    or (discount_percentage > 0 and discount_percentage <= 100)
  ),
  discount_amount_cents integer check (
    discount_amount_cents is null or discount_amount_cents > 0
  ),
  original_price_cents integer check (
    original_price_cents is null or original_price_cents > 0
  ),
  deal_price_cents integer check (
    deal_price_cents is null or deal_price_cents > 0
  ),
  offer_details text check (
    offer_details is null or char_length(trim(offer_details)) between 2 and 300
  ),
  gst_included boolean,
  start_date date,
  end_date date,
  conditions text check (conditions is null or char_length(conditions) <= 1000),
  claim_limit integer check (claim_limit is null or claim_limit between 1 and 1000000),
  exclusions text check (exclusions is null or char_length(exclusions) <= 1000),
  redemption_instructions text check (
    redemption_instructions is null
    or char_length(trim(redemption_instructions)) between 3 and 1000
  ),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date is null or end_date is null or end_date >= start_date),
  check (
    offer_type <> 'special_price'
    or original_price_cents is null
    or deal_price_cents is null
    or deal_price_cents < original_price_cents
  )
);

create table public.business_deal_locations (
  deal_id uuid not null references public.business_deals(id) on delete cascade,
  location_id uuid not null references public.business_locations(id) on delete restrict,
  primary key (deal_id, location_id)
);

-- Preserve usable locations for businesses registered before this feature.
-- Service areas are the best available location data in the earlier schema;
-- deals-only businesses receive a clearly editable fallback location.
insert into public.business_locations (business_id, name)
select distinct area.business_id, area.service_area
from public.business_service_areas as area
join public.business_capabilities as capability
  on capability.business_id = area.business_id
  and capability.deals_enabled
where char_length(trim(area.service_area)) >= 2
on conflict (business_id, name) do nothing;

insert into public.business_locations (business_id, name)
select capability.business_id, 'Main location'
from public.business_capabilities as capability
where capability.deals_enabled
  and not exists (
    select 1
    from public.business_locations as location
    where location.business_id = capability.business_id
  )
on conflict (business_id, name) do nothing;

create index business_locations_business_id_idx
  on public.business_locations(business_id);
create index business_deals_business_status_idx
  on public.business_deals(business_id, status, updated_at desc);
create index business_deal_locations_location_id_idx
  on public.business_deal_locations(location_id);

create trigger business_deals_set_updated_at
  before update on public.business_deals
  for each row execute function public.set_account_data_updated_at();

create or replace function public.validate_published_business_deal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'published' then
    new.published_at := null;
    return new;
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
  return new;
end;
$$;

create trigger validate_business_deal_before_publish
  before insert or update on public.business_deals
  for each row execute function public.validate_published_business_deal();

alter table public.business_locations enable row level security;
alter table public.business_deals enable row level security;
alter table public.business_deal_locations enable row level security;

grant select, insert, update, delete on public.business_locations to authenticated;
grant select, insert, update, delete on public.business_deals to authenticated;
grant select, insert, update, delete on public.business_deal_locations to authenticated;

create policy "Members can view business locations"
  on public.business_locations for select to authenticated
  using (public.is_business_member(business_id));

create policy "Owners and admins can manage business locations"
  on public.business_locations for all to authenticated
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));

create policy "Consumers can view locations for published deals"
  on public.business_locations for select to authenticated
  using (
    exists (
      select 1
      from public.business_deal_locations as deal_location
      join public.business_deals as deal on deal.id = deal_location.deal_id
      where deal_location.location_id = business_locations.id
        and deal.status = 'published'
    )
  );

create policy "Members can view their business deals"
  on public.business_deals for select to authenticated
  using (public.is_business_member(business_id));

create policy "Consumers can view published deals"
  on public.business_deals for select to authenticated
  using (status = 'published');

create policy "Members can create deal drafts"
  on public.business_deals for insert to authenticated
  with check (
    public.business_has_capability(business_id, 'deals')
  );

create policy "Members can update deals"
  on public.business_deals for update to authenticated
  using (public.is_business_member(business_id))
  with check (
    public.business_has_capability(business_id, 'deals')
  );

create policy "Owners and admins can remove deals"
  on public.business_deals for delete to authenticated
  using (public.can_manage_business(business_id));

create policy "Members can view their deal locations"
  on public.business_deal_locations for select to authenticated
  using (
    exists (
      select 1
      from public.business_deals as deal
      where deal.id = deal_id
        and public.is_business_member(deal.business_id)
    )
  );

create policy "Consumers can view published deal locations"
  on public.business_deal_locations for select to authenticated
  using (
    exists (
      select 1
      from public.business_deals as deal
      where deal.id = deal_id
        and deal.status = 'published'
    )
  );

create or replace function public.business_location_belongs_to(
  p_location_id uuid,
  p_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_locations
    where id = p_location_id
      and business_id = p_business_id
  );
$$;

revoke all on function public.business_location_belongs_to(uuid, uuid) from public;
grant execute on function public.business_location_belongs_to(uuid, uuid)
  to authenticated;

create policy "Members can add deal locations"
  on public.business_deal_locations for insert to authenticated
  with check (
    exists (
      select 1
      from public.business_deals as deal
      where deal.id = deal_id
        and public.is_business_member(deal.business_id)
        and public.business_location_belongs_to(location_id, deal.business_id)
    )
  );

create policy "Members can remove deal locations"
  on public.business_deal_locations for delete to authenticated
  using (
    exists (
      select 1
      from public.business_deals as deal
      where deal.id = deal_id
        and public.is_business_member(deal.business_id)
    )
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'deal-images',
  'deal-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Business members can upload deal images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'deal-images'
    and public.business_has_capability(
      ((storage.foldername(name))[1])::uuid,
      'deals'
    )
  );

create policy "Business members can update deal images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'deal-images'
    and public.business_has_capability(
      ((storage.foldername(name))[1])::uuid,
      'deals'
    )
  )
  with check (
    bucket_id = 'deal-images'
    and public.business_has_capability(
      ((storage.foldername(name))[1])::uuid,
      'deals'
    )
  );

create policy "Business members can delete deal images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'deal-images'
    and public.business_has_capability(
      ((storage.foldername(name))[1])::uuid,
      'deals'
    )
  );

-- New businesses capture physical locations during onboarding. Keeping this
-- in the account-creation transaction prevents an unusable deals account.
drop function if exists public.create_business_with_owner(
  text,
  text,
  boolean,
  boolean,
  boolean,
  text,
  text,
  text[],
  text[]
);

create function public.create_business_with_owner(
  p_business_name text,
  p_description text default '',
  p_deals_enabled boolean default false,
  p_loyalty_enabled boolean default false,
  p_service_marketplace_enabled boolean default false,
  p_service_description text default null,
  p_availability text default null,
  p_categories text[] default '{}'::text[],
  p_areas text[] default '{}'::text[],
  p_locations text[] default '{}'::text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_business_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_business_name, ''))) < 2 then
    raise exception 'Enter a valid business name';
  end if;

  if not (p_deals_enabled or p_loyalty_enabled or p_service_marketplace_enabled) then
    raise exception 'Select at least one LocalLink capability';
  end if;

  if p_deals_enabled and coalesce(array_length(p_locations, 1), 0) = 0 then
    raise exception 'Enter at least one business location';
  end if;

  if p_service_marketplace_enabled and (
    char_length(trim(coalesce(p_service_description, ''))) < 10
    or char_length(trim(coalesce(p_availability, ''))) < 2
    or coalesce(array_length(p_categories, 1), 0) = 0
    or coalesce(array_length(p_areas, 1), 0) = 0
  ) then
    raise exception 'Complete all Service Marketplace details';
  end if;

  insert into public.businesses (
    business_name,
    description,
    verification_status,
    onboarding_completed_at
  )
  values (
    trim(p_business_name),
    trim(coalesce(p_description, '')),
    case when p_service_marketplace_enabled then 'pending' else 'not_required' end,
    now()
  )
  returning id into v_business_id;

  insert into public.business_members (business_id, profile_id, role)
  values (v_business_id, v_user_id, 'owner');

  insert into public.business_capabilities (
    business_id,
    deals_enabled,
    loyalty_enabled,
    service_marketplace_enabled
  )
  values (
    v_business_id,
    p_deals_enabled,
    p_loyalty_enabled,
    p_service_marketplace_enabled
  );

  insert into public.business_locations (business_id, name)
  select v_business_id, trim(location_name)
  from unnest(p_locations) as location_name
  where char_length(trim(location_name)) >= 2
  on conflict (business_id, name) do nothing;

  if p_service_marketplace_enabled then
    insert into public.business_service_profiles (
      business_id,
      service_description,
      availability
    )
    values (
      v_business_id,
      trim(p_service_description),
      trim(p_availability)
    );

    insert into public.business_service_categories (business_id, service_category)
    select v_business_id, trim(category)
    from unnest(p_categories) as category
    where char_length(trim(category)) >= 2
    on conflict (business_id, service_category) do nothing;

    insert into public.business_service_areas (business_id, service_area)
    select v_business_id, trim(area)
    from unnest(p_areas) as area
    where char_length(trim(area)) >= 2
    on conflict (business_id, service_area) do nothing;
  end if;

  return v_business_id;
end;
$$;

revoke all on function public.create_business_with_owner(
  text,
  text,
  boolean,
  boolean,
  boolean,
  text,
  text,
  text[],
  text[],
  text[]
) from public;
grant execute on function public.create_business_with_owner(
  text,
  text,
  boolean,
  boolean,
  boolean,
  text,
  text,
  text[],
  text[],
  text[]
) to authenticated;
