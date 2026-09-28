
alter table public.business_loyalty_programmes
  add column start_date date,
  add column end_date date,
  add column published_at timestamptz,
  add constraint business_loyalty_programmes_availability_check check (
    end_date is null or start_date is null or end_date >= start_date
  );

alter table public.business_loyalty_programmes
  drop constraint if exists business_loyalty_programmes_status_check;

create or replace function public.validate_published_loyalty_programme()
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
    raise exception 'Invalid loyalty programme status' using errcode = '23514';
  end if;

  if new.name is null
    or char_length(trim(new.name)) not between 3 and 120
    or new.programme_type not in ('stamp', 'points')
    or new.reward_description is null
    or char_length(trim(new.reward_description)) not between 3 and 240
    or new.reward_threshold is null
    or new.reward_threshold not between 1 and 1000000
    or new.earning_rules is null
    or char_length(trim(new.earning_rules)) not between 3 and 500
    or new.start_date is null
    or (
      new.status <> 'expired'
      and new.end_date is not null
      and new.end_date < v_local_today
    )
  then
    raise exception 'Complete every required loyalty programme field before publishing'
      using errcode = '23514';
  end if;

  new.published_at := coalesce(new.published_at, now());

  if new.status = 'published' then
    new.status := case
      when new.start_date > v_local_today then 'scheduled'
      else 'active'
    end;
  end if;

  return new;
end;
$$;

create trigger validate_loyalty_programme_before_publish
  before insert or update on public.business_loyalty_programmes
  for each row execute function public.validate_published_loyalty_programme();

alter table public.business_loyalty_programmes
  add constraint business_loyalty_programmes_status_check check (
    status in ('draft', 'scheduled', 'active', 'expired')
  );

drop policy if exists "Consumers can view published loyalty programmes"
  on public.business_loyalty_programmes;

create policy "Consumers can view active loyalty programmes"
  on public.business_loyalty_programmes for select to authenticated
  using (status = 'active');

drop policy if exists "Members can update loyalty programme drafts"
  on public.business_loyalty_programmes;

create policy "Members can publish loyalty programme drafts"
  on public.business_loyalty_programmes for update to authenticated
  using (
    status = 'draft'
    and public.is_business_member(business_id)
  )
  with check (
    status in ('draft', 'scheduled', 'active', 'expired')
    and public.business_has_capability(business_id, 'loyalty')
  );

create or replace function public.save_business_loyalty_programme(
  p_programme_id uuid,
  p_business_id uuid,
  p_name text,
  p_programme_type text,
  p_reward_description text,
  p_reward_threshold integer,
  p_earning_rules text,
  p_terms text,
  p_start_date date,
  p_end_date date,
  p_status text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_programme_id uuid;
begin
  if p_status not in ('draft', 'published') then
    raise exception 'Invalid loyalty programme status' using errcode = '22023';
  end if;

  if p_programme_id is not null then
    update public.business_loyalty_programmes
    set
      name = p_name,
      programme_type = p_programme_type,
      reward_description = p_reward_description,
      reward_threshold = p_reward_threshold,
      earning_rules = p_earning_rules,
      terms = p_terms,
      start_date = p_start_date,
      end_date = p_end_date,
      status = 'draft'
    where id = p_programme_id
      and business_id = p_business_id
      and status = 'draft'
    returning id into v_programme_id;
  end if;

  if v_programme_id is null then
    insert into public.business_loyalty_programmes (
      id,
      business_id,
      name,
      programme_type,
      reward_description,
      reward_threshold,
      earning_rules,
      terms,
      start_date,
      end_date,
      status
    )
    values (
      coalesce(p_programme_id, gen_random_uuid()),
      p_business_id,
      p_name,
      p_programme_type,
      p_reward_description,
      p_reward_threshold,
      p_earning_rules,
      p_terms,
      p_start_date,
      p_end_date,
      'draft'
    )
    returning id into v_programme_id;
  end if;

  if p_status = 'published' then
    update public.business_loyalty_programmes
    set status = 'published'
    where id = v_programme_id;
  end if;

  return v_programme_id;
end;
$$;

revoke all on function public.save_business_loyalty_programme(
  uuid,
  uuid,
  text,
  text,
  text,
  integer,
  text,
  text,
  date,
  date,
  text
) from public;

grant execute on function public.save_business_loyalty_programme(
  uuid,
  uuid,
  text,
  text,
  text,
  integer,
  text,
  text,
  date,
  date,
  text
) to authenticated;

create or replace function public.refresh_loyalty_programme_statuses(
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

  update public.business_loyalty_programmes
  set status = case
    when end_date is not null and end_date < p_today then 'expired'
    else 'active'
  end
  where status = 'scheduled'
    and start_date <= p_today;
  get diagnostics v_activated = row_count;

  update public.business_loyalty_programmes
  set status = 'expired'
  where status = 'active'
    and end_date is not null
    and end_date < p_today;
  get diagnostics v_expired = row_count;

  return v_activated + v_expired;
end;
$$;

revoke all on function public.refresh_loyalty_programme_statuses(date)
  from public;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'refresh-loyalty-programme-statuses',
  '*/5 * * * *',
  $schedule$select public.refresh_loyalty_programme_statuses();$schedule$
);
