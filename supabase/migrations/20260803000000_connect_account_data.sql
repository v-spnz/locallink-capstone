
create table public.job_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 60),
  description text not null check (char_length(trim(description)) between 10 and 400),
  category text not null check (
    category in ('Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Landscaping', 'Roofing')
  ),
  city text not null check (char_length(trim(city)) between 2 and 80),
  suburb text not null check (char_length(trim(suburb)) between 2 and 100),
  radius_km integer not null check (radius_km between 1 and 10),
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mock_loyalty_catalog (
  id integer primary key,
  programme_type text not null check (programme_type in ('points', 'stamp')),
  starting_balance integer not null check (starting_balance >= 0),
  reward_threshold integer not null check (reward_threshold > 0),
  reward_description text not null
);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_programme_id integer not null references public.mock_loyalty_catalog(id),
  redeemed_at timestamptz not null default now(),
  unique (user_id, mock_programme_id)
);

create index job_requests_customer_id_idx
  on public.job_requests(customer_id, created_at desc);
create index reward_redemptions_user_id_idx
  on public.reward_redemptions(user_id, redeemed_at desc);

alter table public.job_requests enable row level security;
alter table public.mock_loyalty_catalog enable row level security;
alter table public.reward_redemptions enable row level security;

grant select, insert, update, delete on public.job_requests to authenticated;
grant select on public.reward_redemptions to authenticated;

create policy "Users can view their own jobs"
  on public.job_requests for select to authenticated
  using (customer_id = (select auth.uid()));

create policy "Users can create their own jobs"
  on public.job_requests for insert to authenticated
  with check (customer_id = (select auth.uid()));

create policy "Users can update their own jobs"
  on public.job_requests for update to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

create policy "Users can delete their own jobs"
  on public.job_requests for delete to authenticated
  using (customer_id = (select auth.uid()));

create policy "Users can view their own redemptions"
  on public.reward_redemptions for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.set_account_data_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger job_requests_set_updated_at
  before update on public.job_requests
  for each row execute function public.set_account_data_updated_at();

create or replace function public.redeem_mock_loyalty_reward(p_mock_programme_id integer)
returns public.reward_redemptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_catalogue public.mock_loyalty_catalog;
  v_redemption public.reward_redemptions;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_catalogue
  from public.mock_loyalty_catalog
  where id = p_mock_programme_id;

  if not found then
    raise exception 'Loyalty programme not found' using errcode = 'P0002';
  end if;

  if v_catalogue.starting_balance < v_catalogue.reward_threshold then
    raise exception 'Reward is not yet eligible';
  end if;

  insert into public.reward_redemptions (user_id, mock_programme_id)
  values (auth.uid(), p_mock_programme_id)
  returning * into v_redemption;

  return v_redemption;
exception
  when unique_violation then
    raise exception 'Reward already redeemed';
end;
$$;

revoke all on function public.redeem_mock_loyalty_reward(integer) from public;
grant execute on function public.redeem_mock_loyalty_reward(integer) to authenticated;

insert into public.mock_loyalty_catalog (
  id, programme_type, starting_balance, reward_threshold, reward_description
)
values
  (1, 'stamp', 7, 10, 'Free coffee of your choice'),
  (2, 'points', 320, 500, '20% off your next bouquet'),
  (3, 'stamp', 6, 8, 'Free medium pizza'),
  (4, 'stamp', 10, 10, 'Free premium car wash'),
  (5, 'points', 500, 500, '$15 voucher'),
  (6, 'stamp', 3, 6, 'Free loaf of bread');
