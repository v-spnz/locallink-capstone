-- US0103: allow loyalty-enabled businesses to prepare private programme drafts.

create table public.business_loyalty_programmes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text check (
    name is null or char_length(trim(name)) between 3 and 120
  ),
  programme_type text check (
    programme_type is null or programme_type in ('stamp', 'points')
  ),
  reward_description text check (
    reward_description is null
    or char_length(trim(reward_description)) between 3 and 240
  ),
  reward_threshold integer check (
    reward_threshold is null or reward_threshold between 1 and 1000000
  ),
  earning_rules text check (
    earning_rules is null or char_length(earning_rules) <= 500
  ),
  terms text check (
    terms is null or char_length(terms) <= 1000
  ),
  status text not null default 'draft' check (
    status in ('draft', 'published')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_loyalty_programmes_business_status_idx
  on public.business_loyalty_programmes(
    business_id,
    status,
    updated_at desc
  );

create trigger business_loyalty_programmes_set_updated_at
  before update on public.business_loyalty_programmes
  for each row execute function public.set_account_data_updated_at();

alter table public.business_loyalty_programmes enable row level security;

grant select, insert, update, delete
  on public.business_loyalty_programmes to authenticated;

create policy "Members can view their business loyalty programmes"
  on public.business_loyalty_programmes for select to authenticated
  using (public.is_business_member(business_id));

create policy "Consumers can view published loyalty programmes"
  on public.business_loyalty_programmes for select to authenticated
  using (status = 'published');

create policy "Members can create loyalty programme drafts"
  on public.business_loyalty_programmes for insert to authenticated
  with check (
    status = 'draft'
    and public.business_has_capability(business_id, 'loyalty')
  );

create policy "Members can update loyalty programme drafts"
  on public.business_loyalty_programmes for update to authenticated
  using (
    status = 'draft'
    and public.is_business_member(business_id)
  )
  with check (
    status = 'draft'
    and public.business_has_capability(business_id, 'loyalty')
  );

create policy "Owners and admins can remove loyalty programme drafts"
  on public.business_loyalty_programmes for delete to authenticated
  using (
    status = 'draft'
    and public.can_manage_business(business_id)
  );
