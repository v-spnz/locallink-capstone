-- US0109: let loyalty-enabled businesses identify a customer's programme
-- record from a customer-presented identifier without exposing account data.

create table public.customer_loyalty_records (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.business_loyalty_programmes(id)
    on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  loyalty_identifier text not null default (
    'LL-'
    || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4))
    || '-'
    || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4))
  ),
  current_progress numeric(12, 2) not null default 0 check (
    current_progress >= 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, customer_id),
  unique (loyalty_identifier),
  check (loyalty_identifier ~ '^LL-[A-Z0-9]{4}-[A-Z0-9]{4}$')
);

create index customer_loyalty_records_customer_idx
  on public.customer_loyalty_records(customer_id, updated_at desc);

create trigger customer_loyalty_records_set_updated_at
  before update on public.customer_loyalty_records
  for each row execute function public.set_account_data_updated_at();

alter table public.customer_loyalty_records enable row level security;

grant select on public.customer_loyalty_records to authenticated;

create policy "Customers can view their own loyalty records"
  on public.customer_loyalty_records for select to authenticated
  using (customer_id = (select auth.uid()));

create table public.customer_loyalty_scan_codes (
  id uuid primary key default gen_random_uuid(),
  loyalty_record_id uuid not null references public.customer_loyalty_records(id)
    on delete cascade,
  scan_code text not null default upper(
    substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12)
  ),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  unique (scan_code),
  check (scan_code ~ '^[A-Z0-9]{12}$'),
  check (expires_at > created_at)
);

create index customer_loyalty_scan_codes_record_idx
  on public.customer_loyalty_scan_codes(loyalty_record_id, expires_at desc);

alter table public.customer_loyalty_scan_codes enable row level security;

create or replace function public.create_my_loyalty_scan_code(
  p_loyalty_record_id uuid
)
returns table (
  scan_code text,
  expires_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.customer_loyalty_records as record
    join public.business_loyalty_programmes as programme
      on programme.id = record.programme_id
    where record.id = p_loyalty_record_id
      and record.customer_id = auth.uid()
      and programme.status = 'active'
  ) then
    return;
  end if;

  delete from public.customer_loyalty_scan_codes as code
  where code.loyalty_record_id = p_loyalty_record_id;

  return query
  insert into public.customer_loyalty_scan_codes (loyalty_record_id)
  values (p_loyalty_record_id)
  returning
    customer_loyalty_scan_codes.scan_code,
    customer_loyalty_scan_codes.expires_at;
end;
$$;

revoke all on function public.create_my_loyalty_scan_code(uuid) from public;
grant execute on function public.create_my_loyalty_scan_code(uuid)
  to authenticated;

create or replace function public.lookup_business_loyalty_record(
  p_business_id uuid,
  p_loyalty_identifier text
)
returns table (
  loyalty_record_id uuid,
  loyalty_identifier text,
  customer_display_name text,
  programme_id uuid,
  programme_name text,
  programme_type text,
  programme_status text,
  current_progress numeric,
  reward_threshold numeric,
  reward_description text,
  reward_value numeric,
  earning_rules text,
  reward_eligible boolean,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_normalised_identifier text := upper(
    regexp_replace(
      regexp_replace(coalesce(p_loyalty_identifier, ''), '^.*:', ''),
      '[^A-Za-z0-9]',
      '',
      'g'
    )
  );
begin
  if auth.uid() is null
    or not public.business_has_capability(p_business_id, 'loyalty')
    or v_normalised_identifier !~ '^(LL[A-Z0-9]{8}|[A-Z0-9]{12})$'
  then
    return;
  end if;

  return query
  select
    record.id,
    record.loyalty_identifier,
    concat_ws(
      ' ',
      nullif(trim(customer.first_name), ''),
      case
        when nullif(trim(customer.last_name), '') is not null
          then upper(left(trim(customer.last_name), 1)) || '.'
        else null
      end
    ),
    programme.id,
    programme.name,
    programme.programme_type,
    programme.status,
    record.current_progress,
    programme.reward_threshold,
    programme.reward_description,
    programme.reward_value,
    programme.earning_rules,
    programme.status = 'active'
      and record.current_progress >= programme.reward_threshold,
    record.updated_at
  from public.customer_loyalty_records as record
  join public.business_loyalty_programmes as programme
    on programme.id = record.programme_id
  join public.profiles as customer
    on customer.id = record.customer_id
  left join public.customer_loyalty_scan_codes as scan_code
    on scan_code.loyalty_record_id = record.id
    and scan_code.scan_code = v_normalised_identifier
    and scan_code.expires_at >= now()
  where programme.business_id = p_business_id
    and (
      upper(
        regexp_replace(record.loyalty_identifier, '[^A-Za-z0-9]', '', 'g')
      ) = v_normalised_identifier
      or scan_code.id is not null
    )
  limit 1;
end;
$$;

revoke all on function public.lookup_business_loyalty_record(uuid, text)
  from public;
grant execute on function public.lookup_business_loyalty_record(uuid, text)
  to authenticated;

create or replace function public.get_my_loyalty_records()
returns table (
  loyalty_record_id uuid,
  loyalty_identifier text,
  business_name text,
  programme_id uuid,
  programme_name text,
  programme_type text,
  programme_status text,
  current_progress numeric,
  reward_threshold numeric,
  reward_description text,
  reward_value numeric,
  earning_rules text,
  reward_eligible boolean,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    record.id,
    record.loyalty_identifier,
    business.business_name,
    programme.id,
    programme.name,
    programme.programme_type,
    programme.status,
    record.current_progress,
    programme.reward_threshold,
    programme.reward_description,
    programme.reward_value,
    programme.earning_rules,
    programme.status = 'active'
      and record.current_progress >= programme.reward_threshold,
    record.updated_at
  from public.customer_loyalty_records as record
  join public.business_loyalty_programmes as programme
    on programme.id = record.programme_id
  join public.businesses as business
    on business.id = programme.business_id
  where record.customer_id = (select auth.uid())
    and programme.status <> 'draft'
  order by record.updated_at desc;
$$;

revoke all on function public.get_my_loyalty_records() from public;
grant execute on function public.get_my_loyalty_records() to authenticated;
