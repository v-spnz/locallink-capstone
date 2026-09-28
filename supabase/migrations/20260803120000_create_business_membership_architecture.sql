
alter table public.profiles drop column if exists account_type;

insert into public.profiles (id, first_name, last_name)
select
  user_record.id,
  coalesce(
    nullif(trim(user_record.raw_user_meta_data ->> 'first_name'), ''),
    'LocalLink'
  ),
  coalesce(
    nullif(trim(user_record.raw_user_meta_data ->> 'last_name'), ''),
    'member'
  )
from auth.users as user_record
on conflict (id) do nothing;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(trim(business_name)) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  verification_status text not null default 'not_required' check (
    verification_status in ('not_required', 'pending', 'verified', 'rejected')
  ),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  primary key (business_id, profile_id)
);

create table public.business_capabilities (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  deals_enabled boolean not null default false,
  loyalty_enabled boolean not null default false,
  service_marketplace_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  check (deals_enabled or loyalty_enabled or service_marketplace_enabled)
);

create table public.business_service_profiles (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  service_description text not null check (
    char_length(trim(service_description)) between 10 and 1000
  ),
  availability text not null check (char_length(trim(availability)) between 2 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_category text not null check (
    char_length(trim(service_category)) between 2 and 100
  ),
  created_at timestamptz not null default now(),
  unique (business_id, service_category)
);

create table public.business_service_areas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_area text not null check (char_length(trim(service_area)) between 2 and 120),
  created_at timestamptz not null default now(),
  unique (business_id, service_area)
);

create index business_members_profile_id_idx
  on public.business_members(profile_id, created_at);
create index business_service_categories_business_id_idx
  on public.business_service_categories(business_id);
create index business_service_areas_business_id_idx
  on public.business_service_areas(business_id);

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_account_data_updated_at();

create trigger business_capabilities_set_updated_at
  before update on public.business_capabilities
  for each row execute function public.set_account_data_updated_at();

create trigger business_service_profiles_set_updated_at
  before update on public.business_service_profiles
  for each row execute function public.set_account_data_updated_at();

create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = p_business_id
      and profile_id = (select auth.uid())
  );
$$;

create or replace function public.can_manage_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = p_business_id
      and profile_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.business_has_capability(
  p_business_id uuid,
  p_capability text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_capabilities
    where business_id = p_business_id
      and public.is_business_member(p_business_id)
      and case p_capability
        when 'deals' then deals_enabled
        when 'loyalty' then loyalty_enabled
        when 'service_marketplace' then service_marketplace_enabled
        else false
      end
  );
$$;

revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.can_manage_business(uuid) from public;
revoke all on function public.business_has_capability(uuid, text) from public;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.can_manage_business(uuid) to authenticated;
grant execute on function public.business_has_capability(uuid, text) to authenticated;

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.business_capabilities enable row level security;
alter table public.business_service_profiles enable row level security;
alter table public.business_service_categories enable row level security;
alter table public.business_service_areas enable row level security;

grant select on public.businesses to authenticated;
grant select on public.business_members to authenticated;
grant select on public.business_capabilities to authenticated;
grant select, insert, update, delete on public.business_service_profiles to authenticated;
grant select, insert, delete on public.business_service_categories to authenticated;
grant select, insert, delete on public.business_service_areas to authenticated;

create policy "Members can view their businesses"
  on public.businesses for select to authenticated
  using (public.is_business_member(id));

create policy "Members can view business memberships"
  on public.business_members for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members can view business capabilities"
  on public.business_capabilities for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members can view service profiles"
  on public.business_service_profiles for select to authenticated
  using (public.is_business_member(business_id));

create policy "Owners and admins can add service profiles"
  on public.business_service_profiles for insert to authenticated
  with check (
    public.can_manage_business(business_id)
    and public.business_has_capability(business_id, 'service_marketplace')
  );

create policy "Owners and admins can update service profiles"
  on public.business_service_profiles for update to authenticated
  using (public.can_manage_business(business_id))
  with check (
    public.can_manage_business(business_id)
    and public.business_has_capability(business_id, 'service_marketplace')
  );

create policy "Owners and admins can remove service profiles"
  on public.business_service_profiles for delete to authenticated
  using (public.can_manage_business(business_id));

create policy "Members can view service categories"
  on public.business_service_categories for select to authenticated
  using (public.is_business_member(business_id));

create policy "Owners and admins can add service categories"
  on public.business_service_categories for insert to authenticated
  with check (
    public.can_manage_business(business_id)
    and public.business_has_capability(business_id, 'service_marketplace')
  );

create policy "Owners and admins can remove service categories"
  on public.business_service_categories for delete to authenticated
  using (public.can_manage_business(business_id));

create policy "Members can view service areas"
  on public.business_service_areas for select to authenticated
  using (public.is_business_member(business_id));

create policy "Owners and admins can add service areas"
  on public.business_service_areas for insert to authenticated
  with check (
    public.can_manage_business(business_id)
    and public.business_has_capability(business_id, 'service_marketplace')
  );

create policy "Owners and admins can remove service areas"
  on public.business_service_areas for delete to authenticated
  using (public.can_manage_business(business_id));

create or replace function public.create_business_with_owner(
  p_business_name text,
  p_description text default '',
  p_deals_enabled boolean default false,
  p_loyalty_enabled boolean default false,
  p_service_marketplace_enabled boolean default false,
  p_service_description text default null,
  p_availability text default null,
  p_categories text[] default '{}'::text[],
  p_areas text[] default '{}'::text[]
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
  text[]
) to authenticated;
