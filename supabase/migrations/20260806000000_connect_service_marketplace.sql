-- Connect consumer job requests to service businesses without exposing the
-- customer's account identifier. Businesses receive matched leads through
-- controlled RPCs; customers receive quotes and job status updates.

alter table public.job_requests
  drop constraint if exists job_requests_status_check;

alter table public.job_requests
  add constraint job_requests_status_check check (
    status in ('open', 'in_progress', 'completed', 'closed', 'cancelled')
  );

drop policy if exists "Users can update their own jobs" on public.job_requests;
create policy "Users can update their own open jobs"
  on public.job_requests for update to authenticated
  using (
    customer_id = (select auth.uid())
    and status in ('open', 'closed', 'cancelled')
  )
  with check (
    customer_id = (select auth.uid())
    and status in ('open', 'closed', 'cancelled')
  );

drop policy if exists "Users can delete their own jobs" on public.job_requests;
create policy "Users can delete their own inactive jobs"
  on public.job_requests for delete to authenticated
  using (
    customer_id = (select auth.uid())
    and status in ('open', 'closed', 'cancelled')
  );

create table public.job_quotes (
  id uuid primary key default gen_random_uuid(),
  job_request_id uuid not null references public.job_requests(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  amount_cents integer not null check (amount_cents between 100 and 100000000),
  message text not null check (char_length(trim(message)) between 10 and 1000),
  status text not null default 'submitted' check (
    status in ('submitted', 'accepted', 'rejected', 'withdrawn')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_request_id, business_id)
);

create unique index job_quotes_one_accepted_per_job_idx
  on public.job_quotes(job_request_id)
  where status = 'accepted';

create index job_quotes_business_id_idx
  on public.job_quotes(business_id, created_at desc);
create index job_quotes_job_request_id_idx
  on public.job_quotes(job_request_id, created_at desc);

create trigger job_quotes_set_updated_at
  before update on public.job_quotes
  for each row execute function public.set_account_data_updated_at();

alter table public.job_quotes enable row level security;
grant select on public.job_quotes to authenticated;

create policy "Customers and business members can view relevant quotes"
  on public.job_quotes for select to authenticated
  using (
    public.is_business_member(business_id)
    or exists (
      select 1
      from public.job_requests as job
      where job.id = job_quotes.job_request_id
        and job.customer_id = (select auth.uid())
    )
  );

create or replace function public.get_business_job_leads(p_business_id uuid)
returns table (
  job_request_id uuid,
  title text,
  description text,
  category text,
  city text,
  suburb text,
  radius_km integer,
  job_status text,
  created_at timestamptz,
  has_quote boolean
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
    job.id,
    job.title,
    job.description,
    job.category,
    job.city,
    job.suburb,
    job.radius_km,
    job.status,
    job.created_at,
    exists (
      select 1
      from public.job_quotes as quote
      where quote.job_request_id = job.id
        and quote.business_id = p_business_id
    )
  from public.job_requests as job
  where job.status = 'open'
    and exists (
      select 1
      from public.business_service_categories as service_category
      where service_category.business_id = p_business_id
        and lower(trim(service_category.service_category)) = lower(trim(job.category))
    )
    and exists (
      select 1
      from public.business_service_areas as service_area
      where service_area.business_id = p_business_id
        and lower(trim(service_area.service_area)) in (
          lower(trim(job.suburb)),
          lower(trim(job.city))
        )
    )
  order by job.created_at desc;
end;
$$;

create or replace function public.submit_business_quote(
  p_business_id uuid,
  p_job_request_id uuid,
  p_amount_cents integer,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote_id uuid;
  v_job_matches boolean;
begin
  if not public.business_has_capability(p_business_id, 'service_marketplace') then
    raise exception 'Service Marketplace access required' using errcode = '42501';
  end if;

  if p_amount_cents < 100 or p_amount_cents > 100000000 then
    raise exception 'Enter a valid quote amount';
  end if;

  if char_length(trim(coalesce(p_message, ''))) < 10
    or char_length(trim(coalesce(p_message, ''))) > 1000 then
    raise exception 'Quote message must be between 10 and 1000 characters';
  end if;

  select exists (
    select 1
    from public.job_requests as job
    where job.id = p_job_request_id
      and job.status = 'open'
      and exists (
        select 1
        from public.business_service_categories as service_category
        where service_category.business_id = p_business_id
          and lower(trim(service_category.service_category)) = lower(trim(job.category))
      )
      and exists (
        select 1
        from public.business_service_areas as service_area
        where service_area.business_id = p_business_id
          and lower(trim(service_area.service_area)) in (
            lower(trim(job.suburb)),
            lower(trim(job.city))
          )
      )
  ) into v_job_matches;

  if not v_job_matches then
    raise exception 'This job is not an available match';
  end if;

  insert into public.job_quotes (
    job_request_id,
    business_id,
    amount_cents,
    message,
    status
  )
  values (
    p_job_request_id,
    p_business_id,
    p_amount_cents,
    trim(p_message),
    'submitted'
  )
  on conflict (job_request_id, business_id) do update
  set
    amount_cents = excluded.amount_cents,
    message = excluded.message,
    status = 'submitted'
  returning id into v_quote_id;

  return v_quote_id;
end;
$$;

create or replace function public.get_business_quotes(p_business_id uuid)
returns table (
  quote_id uuid,
  job_request_id uuid,
  title text,
  category text,
  city text,
  suburb text,
  amount_cents integer,
  message text,
  quote_status text,
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
    quote.id,
    job.id,
    job.title,
    job.category,
    job.city,
    job.suburb,
    quote.amount_cents,
    quote.message,
    quote.status,
    quote.created_at
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.business_id = p_business_id
  order by quote.created_at desc;
end;
$$;

create or replace function public.get_business_active_jobs(p_business_id uuid)
returns table (
  job_request_id uuid,
  quote_id uuid,
  title text,
  description text,
  category text,
  city text,
  suburb text,
  amount_cents integer,
  job_status text,
  accepted_at timestamptz
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
    job.id,
    quote.id,
    job.title,
    job.description,
    job.category,
    job.city,
    job.suburb,
    quote.amount_cents,
    job.status,
    quote.updated_at
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.business_id = p_business_id
    and quote.status = 'accepted'
    and job.status in ('in_progress', 'completed')
  order by quote.updated_at desc;
end;
$$;

create or replace function public.get_customer_job_quotes()
returns table (
  quote_id uuid,
  job_request_id uuid,
  business_id uuid,
  business_name text,
  amount_cents integer,
  message text,
  quote_status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    quote.id,
    quote.job_request_id,
    quote.business_id,
    business.business_name,
    quote.amount_cents,
    quote.message,
    quote.status,
    quote.created_at
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  join public.businesses as business on business.id = quote.business_id
  where job.customer_id = (select auth.uid())
  order by quote.created_at desc;
$$;

create or replace function public.respond_to_job_quote(
  p_quote_id uuid,
  p_accept boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job_request_id uuid;
  v_quote_status text;
  v_job_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select quote.job_request_id, quote.status
  into v_job_request_id, v_quote_status
  from public.job_quotes as quote
  join public.job_requests as job on job.id = quote.job_request_id
  where quote.id = p_quote_id
    and job.customer_id = auth.uid();

  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;

  select status into v_job_status
  from public.job_requests
  where id = v_job_request_id
  for update;

  if p_accept then
    if v_quote_status = 'accepted' and v_job_status = 'in_progress' then
      return 'accepted';
    end if;

    if v_quote_status <> 'submitted' or v_job_status <> 'open' then
      raise exception 'This quote can no longer be accepted';
    end if;

    update public.job_quotes
    set status = 'rejected'
    where job_request_id = v_job_request_id
      and id <> p_quote_id
      and status = 'submitted';

    update public.job_quotes
    set status = 'accepted'
    where id = p_quote_id;

    update public.job_requests
    set status = 'in_progress'
    where id = v_job_request_id;

    return 'accepted';
  end if;

  if v_quote_status = 'submitted' then
    update public.job_quotes
    set status = 'rejected'
    where id = p_quote_id;
  end if;

  return 'rejected';
end;
$$;

create or replace function public.complete_business_job(
  p_business_id uuid,
  p_job_request_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.business_has_capability(p_business_id, 'service_marketplace') then
    raise exception 'Service Marketplace access required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.job_quotes
    where business_id = p_business_id
      and job_request_id = p_job_request_id
      and status = 'accepted'
  ) then
    raise exception 'Active job not found' using errcode = 'P0002';
  end if;

  update public.job_requests
  set status = 'completed'
  where id = p_job_request_id
    and status = 'in_progress';

  return found;
end;
$$;

revoke all on function public.get_business_job_leads(uuid) from public;
revoke all on function public.submit_business_quote(uuid, uuid, integer, text) from public;
revoke all on function public.get_business_quotes(uuid) from public;
revoke all on function public.get_business_active_jobs(uuid) from public;
revoke all on function public.get_customer_job_quotes() from public;
revoke all on function public.respond_to_job_quote(uuid, boolean) from public;
revoke all on function public.complete_business_job(uuid, uuid) from public;

grant execute on function public.get_business_job_leads(uuid) to authenticated;
grant execute on function public.submit_business_quote(uuid, uuid, integer, text) to authenticated;
grant execute on function public.get_business_quotes(uuid) to authenticated;
grant execute on function public.get_business_active_jobs(uuid) to authenticated;
grant execute on function public.get_customer_job_quotes() to authenticated;
grant execute on function public.respond_to_job_quote(uuid, boolean) to authenticated;
grant execute on function public.complete_business_job(uuid, uuid) to authenticated;
